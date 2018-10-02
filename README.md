# Actrix

Actrix is actor system library for NodeJS/Browser. While traditionally actors are about concurrency and paralellism of a highly scalable and/or distributed applications, Actrix is mainly designed to help developers to write code which deals well with "concurrency" (read: asynchronousity) without forcing them to completely change the coding paradigm.

<aside class="notice">
Actrix is in a very early development phase, it is not suitable for production yet.
</aside>

## Getting Started

Follow this instruction to get started with Actrix.

### Installing

To use Actrix on your project, install it using npm or yarn.

```
yarn add actrix
```

or

```
npm install actrix
```

## Concepts

Actor is a unit of concurrency where you can define some behavior, similar to an oobject. However, unlike object, you don't invoke a method in actor but you can send messages to it. The messages are scheduled asynchronously, leaving the execution flow up to the actor. Actor process its messages in sequential, one-at-a-time fashion. This makes reasoning of the processing code much simpler.

## API

### Defining Actors

Follow the following template to define an actor.

```
// The interface to "talk" to the actor
type YourActorAPI = {
    yourMethodName: (payload: PayloadType) => Promise<void>; // the exposed "method". They should always be in form of function which returns Promise/CancellablePromise
};

// Define a class which extends Actor<T>. The `T` parameter is only needed when you want to pass a value during initialization.
class YourActor extends Actor<number> implements YourActorAPI {

    yourMethodName = async (payload: PayloadType) => {
        // Implementation for handling messages of this type
        ...
    };

    // Optional, only needed if `T` is defined. This will be triggered when the actor is instantiated
    protected init(initialCounter: number) {
        // Implementation
        ...
    }
}
```

### Create Actor Systems

```
const actorSystem = new ActorSystem(name?);
```

Create a new actor system with a specified string as the name. When name is not specified, it will randomly create a random value for it.

### Create Actors

```
const actorRef = actorSystem.createActor(options);
```

Create a new actor inside the actorSystem. The options parameter are as follow:
```
name: (Required) A string representing the name of your actor instance
actorClass: (Required) The class definition of the actor
paramOptions: (Optional) The value you want to pass to the actor during initialization. Only needed when you define the type generic `T` as explained in the actor template
strategies: (Optional) List of strategies you want to use for your actor. At the moment it has only one possible value: "IgnoreOlderMessageWithTheSameType" which can be used to optimize your actor to only execute the most recent message of the same type.

```

### Sending a Message to Actors

#### From an Actor

```
this.at(actorRef).yourMethodName(payload?);
```

actorRef: (Required) the target actorRef where we send the message to
payload: (As defined by the target actor) payload of the message as defined by the target actor


```
this.at<TargetActorAPI>(address).yourMethodName(payload?);
```

address: (Required) the target address where we send the message to, if TargetActorAPI is not specified then there will be no compile-time check
payload: (As defined by the target actor) payload of the message as defined by the target actor

#### From Everywhere Else

```
actorRef.invoke(sender?).yourMethodName(payload);
```

This is the typical way to send a message to an actor from outside of actors. Sender parameter is optional, but if you need to use it, better to just use the previous API.
sender: (Optional) the address of the sender
payload: (As defined by the target actor) payload of the message as defined by the target actor

### Replying to Messages

```
const senderRef = this.context.senderRef;
this.at(senderRef).yourMethodName(payload);
```

### Getting Address of Actors

```
const address = actorRef.address;
```

## Examples

See [actrix-example](https://github.com/ismailhabib/actrix-example) for examples.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/ismailhabib/actrix/tags). 

## Authors

* **Ismail Habib Muhammad** - *Initial work*

See also the list of [contributors](https://github.com/ismailhabib/actrix/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
