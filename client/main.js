import { fabric } from 'fabric';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

const FabricObjects = new Mongo.Collection('fabricObjects');
Meteor.subscribe('fabricObjects');


Template.board.onCreated(function () {
  this.isDrawingModeVar = new ReactiveVar(true);
  this.colorVar = new ReactiveVar('#000000');
});

Template.board.onRendered(function () {
  const canvas = new fabric.Canvas('canvas', {
    selection: false, // disable group selection
  });

  this.canvas = canvas;

  this.autorun(() => {
    canvas.isDrawingMode = this.isDrawingModeVar.get();
    canvas.freeDrawingBrush.color = this.colorVar.get();
  });

  canvas.on('object:added', (e) => {
    const fabricObject = e.target;
    if (fabricObject.id) {
      return; // this already is on server
    }

    // assign a custom id to a newly crated object
    fabricObject.id = Random.id();
    const doc = fabricObject.toObject();
    doc._id = fabricObject.id; // eslint-disable-line no-underscore-dangle
    FabricObjects.insert(doc);
  });

  canvas.on('object:modified', (e) => {
    const fabricObject = e.target;

    if (!fabricObject.id) {
      console.error(`Missing id at object ${fabricObject}`);
      return;
    }

    FabricObjects.update(fabricObject.id, {
      $set: fabricObject.toObject(),
    });
  });

  this.observer = FabricObjects.find().observeChanges({
    added: (id, doc) => {
      const objectOnCanvas = canvas.getObjectById(id);
      if (objectOnCanvas) {
        return; // nothing to do
      }

      fabric.util.enlivenObjects([doc], ([fabricObject]) => {
        fabricObject.id = id; // eslint-disable-line no-param-reassign
        canvas.add(fabricObject);
      });
    },
    changed: (id, fields) => {
      const objectOnCanvas = canvas.getObjectById(id);
      if (!objectOnCanvas) {
        return; // nothing to do
      }

      objectOnCanvas.set(fields);
      canvas.renderAll();
    },
    removed: (id) => {
      const objectOnCanvas = canvas.getObjectById(id);
      if (!objectOnCanvas) {
        return; // nothing to do
      }

      canvas.remove(objectOnCanvas);
    },
  });
});


Template.board.helpers({
  color() {
    return Template.instance().colorVar.get();
  },
  isDrawingMode() {
    return Template.instance().isDrawingModeVar.get();
  },
  objectsCount() {
    return FabricObjects.find().count();
  },
});


Template.board.events({
  'change .isDrawingMode': (event, instance) => {
    instance.isDrawingModeVar.set(event.target.checked);
  },
  'change .color': (event, instance) => {
    instance.colorVar.set(event.target.value);
  },
  'click .clear': () => {
    Meteor.call('clearCanvas');
  },
});


fabric.Canvas.prototype.getObjectById = function (id) {
  return this.getObjects().find(obj => obj.id === id);
};
