import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({
  title: DS.attr('string'),
  chart: DS.belongsTo('chart-config', {inverse:'sourceGroups'}),
  sources: DS.hasMany('chart-source-config', {inverse:'group'}),
  scaleFactor: DS.attr('number', {default: 1}),

  /**
   Get an array of all configured sources and properties.

   @return {Array} Array of ChartPropertyConfig objects
   */
  sourceProperties: Ember.computed('sources.@each.properties', function() {
    const promise = this.get('sources').then(sources => {
      return Ember.RSVP.all(sources.mapBy('properties'));
    }).then(arrays => {
      var merged = Ember.A();
      arrays.forEach(array => {
        merged.pushObjects(array);
      });
      return merged;
    });
    return DS.PromiseArray.create({promise:promise});
  })

});