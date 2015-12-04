import Ember from 'ember';
import DS from 'ember-data';

export default DS.Model.extend({
  profile: DS.belongsTo('user-profile', {inverse:'chartSources'}),
  source: DS.attr('string'),
  title: DS.attr('string'),

  displayName: Ember.computed('source', 'title', {
    get() {
      const title = this.get('title');
      return (title ? title : this.get('source'));
    },
    set(key, value) {
      this.set('title', value);
      return value;
    }
  }),

});
