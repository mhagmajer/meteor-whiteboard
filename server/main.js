import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

const FabricObjects = new Mongo.Collection('fabricObjects');

Meteor.publish('fabricObjects', function fabricObjects() {
  if (!this.userId()) {
    // this.ready();
    // return [];
  }

  return FabricObjects.find();
});

Meteor.methods({
  clearCanvas() {
    // if (! Meteor.userId()) {
    //   throw new Meteor.Error("not-authorized");
    // }

    FabricObjects.remove({});
  },
});

Meteor.startup(() => {
  // code to run on server at startup
});
