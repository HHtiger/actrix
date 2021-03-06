import { ActorSystem } from "../src/ActorSystem";
import express from "express";
import socketIO from "socket.io";
import { Actor, ActorRef } from "../src/Actor";
import * as http from "http";
import * as ioClient from "socket.io-client";

describe("Actor System", () => {
    it("should be instantiable", () => {
        const actorSystem = new ActorSystem();
    });

    it("should handle exception when message is sent to an actor in a non-existent ActorSystem", async done => {
        const actorSystem = new ActorSystem();
        try {
            await actorSystem.sendMessageAndWait(
                { actorSystemName: "non-existent actor", localAddress: "random address" },
                "random-type",
                null,
                null
            );
            fail(
                "Sending message to an actor in a non-existent actor system should throw an exception"
            );
        } catch (exception) {
            done();
        }
    });
});

let server: http.Server;
let io: SocketIO.Server;
let actorSystem: ActorSystem;
let serverActor: ActorRef<ServerAPI>;
let port: number;

const app = express();
describe("Multi-Actor System", () => {
    beforeEach(() => {
        server = app.listen(0);
        port = server.address().port;
        io = socketIO(server);
        actorSystem = new ActorSystem("server");
        serverActor = actorSystem.createActor({ name: "serverActor", actorClass: ServerActor });
        io.of("/").on("connection", socket => {
            actorSystem.register(socket);
        });
    });
    afterEach(() => {
        server.close();
        io.close();
    });

    it("should allow actors to send message in different actor system", done => {
        serverActor.send().registerListener((param1, param2) => {
            expect(param1).toBe("1");
            expect(param2).toBe("2");
            done();
        });
        const socket = ioClient.connect(`http://localhost:${port}`);
        const clientActorSystem = new ActorSystem();
        clientActorSystem.register(socket);
        const actorRef = clientActorSystem.createActor({
            name: "clientActor",
            actorClass: ClientActor
        });
        setTimeout(() => {
            actorRef.send().trigger();
        }, 3000); // give time for the handshake
    });

    it("should throw exception when trying to ask question to an actor of a disconnected actor system", done => {
        serverActor.send().registerListener(() => {
            fail();
        });
        const socket = ioClient.connect(`http://localhost:${port}`);
        const clientActorSystem = new ActorSystem();
        clientActorSystem.register(socket);
        const actorRef = clientActorSystem.createActor({
            name: "clientActor",
            actorClass: ClientActor
        });
        setTimeout(() => {
            socket.disconnect();
            actorRef
                .ask()
                .trigger()
                .then(
                    () => {
                        fail();
                    },
                    exception => {
                        done();
                    }
                );
        }, 1000); // give time for the handshake
    });

    it("should allow actors to send message in different actor system after reconnection", done => {
        serverActor.send().registerListener(() => {
            done();
        });
        const socket = ioClient.connect(`http://localhost:${port}`, {
            reconnection: true,
            reconnectionDelay: 10
        });
        const clientActorSystem = new ActorSystem();
        clientActorSystem.register(socket);
        const actorRef = clientActorSystem.createActor({
            name: "clientActor",
            actorClass: ClientActor
        });
        setTimeout(() => {
            socket.disconnect();
            socket.connect();
            setTimeout(() => {
                actorRef.send().trigger();
            }, 1000);
        }, 1000); // give time for the handshake
    });
});

type ClientAPI = {
    trigger: () => Promise<void>;
};

class ClientActor extends Actor implements ClientAPI {
    trigger = async () => {
        await this.askTo<ServerAPI>({
            actorSystemName: "server",
            localAddress: "serverActor"
        }).connect("1", "2");
    };
}

type ServerAPI = {
    registerListener: (listener: (param1: string, param2: string) => void) => Promise<void>;
    connect: (param1: string, param2: string) => Promise<void>;
};

class ServerActor extends Actor implements ServerAPI {
    listener: ((param1: string, param2: string) => void) | undefined;

    registerListener = async (listener: (param1: string, param2: string) => void) => {
        this.listener = listener;
    };
    connect = async (param1: string, param2: string) => {
        this.listener && this.listener(param1, param2);
    };
}
