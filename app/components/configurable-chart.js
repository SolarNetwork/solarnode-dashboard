import Ember from 'ember';
import d3 from 'npm:d3';
import { sortByNodeIdThenSource } from '../models/chart-config';

var dateFormat = d3.time.format("%d.%m.%Y");
var datePropertyAccessor = {
    get(key) {
      var val = this.get('chart.'+key);
      return (val ? dateFormat(val) : null);
    },
    set(key, value) {
      var val = (value ? dateFormat.parse(value) : null);
      this.set('chart.'+key, val);
      return (val ? value : null);
    }
};

export default Ember.Component.extend({
  classNames: ['app-configurable-chart'],

  chartName: Ember.computed.alias('chart.title'),
  chartUnit: Ember.computed.alias('chart.unit'),
  chartWidth: 550,
  canSave: Ember.computed('chart.hasDirtyAttributes',
    'chart.groups.@each.{hasDirtyAttributes,isNew}',
    'chart.properties.@each.{hasDirtyAttributes,isNew}',
    function() {
    return (this.get('chart.hasDirtyAttributes')
        || this.get('chart.groups').any(function(obj) { return obj.get('hasDirtyAttributes') || obj.get('isNew'); })
        || this.get('chart.properties').any(function(obj) { return obj.get('hasDirtyAttributes') || obj.get('isNew'); })
        );
  }),
  startDate: Ember.computed('chart.startDate', datePropertyAccessor),
  endDate: Ember.computed('chart.endDate', datePropertyAccessor),
  period: Ember.computed.alias('chart.period'),
  periodType: Ember.computed.alias('chart.periodType'),
  isUsePeriod: Ember.computed.alias('chart.isUsePeriod'),
  isSettingsVisible: Ember.computed.alias('chart.isSettingsVisible'),

  periodTypes: ['hour', 'day', 'month', 'year'],
  periodChoices: Ember.computed('period', 'periodTypes', function() {
    const i18n = this.get('i18n');
    const count = this.get('period');
    return this.get('periodTypes').map(type => {
      return {key:type, label:i18n.t('chart.period.'+type, {count:count}).toString().capitalize()};
    });
  }),

  aggregate: Ember.computed.alias('chart.aggregate'),
  aggregateTypes: ['FiveMinute', 'Hour', 'Day', 'Month', 'Year'],
  aggregateChoices: Ember.computed('aggregate', 'aggregateTypes', function() {
    const i18n = this.get('i18n');
    return this.get('aggregateTypes').map(type => {
      return {key:type, label:i18n.t('chart.aggregate.'+type).toString().capitalize()};
    });
  }),

  /**
   Flag if the current chart style supports the display of grouped data sets.

   @return {boolean} true if the chart style supports grouped data sets
  */
  canGroupSources: Ember.computed('chart.style', function() {
    const style = this.get('chart.style');
    return (style !== 'line'); // TODO: set this to what styles are explicitly supported
  }),

  uniqueSourceConfigs: Ember.computed('chart.uniqueSourceKeys.[]', 'allSourceConfigs.[]', function() {
    const sourceKeys = this.get('chart.uniqueSourceKeys');
    const sourceConfigs = this.get('allSourceConfigs');
    if ( !sourceConfigs ) {
      return Ember.RSVP.resolve(new Ember.A());
    }
    return this.get('allSourceConfigs').filter(sourceConfig => {
      const nodeId = sourceConfig.get('nodeId');
      const sourceId = sourceConfig.get('source');
      return sourceKeys.any(function(sourceKey) {
        return (sourceKey.nodeId === nodeId && sourceKey.source === sourceId);
      });
    }).sort(sortByNodeIdThenSource);
  }),

  props: Ember.computed.mapBy('allPropConfigs', 'prop'),
  uniqueProps: Ember.computed.uniq('props'),
  availableProps: Ember.computed.sort('uniqueProps', function(l, r) {
    return (l < r ? -1 : l > r ? 1 : 0);
  }),

  availableSourceConfigs: Ember.computed('availablePropConfigs.[]', 'allSourceConfigs.[]', function() {
    const allSourceConfigs = this.get('allSourceConfigs');
    const propConfigs = this.get('availablePropConfigs');
    const availableSourceIds = propConfigs.mapBy('source');
    return allSourceConfigs.filter(function(sourceConfig) {
      return availableSourceIds.contains(sourceConfig.get('source'));
    });
  }),

  hasAvailableSourceConfigs: Ember.computed.notEmpty('availableSourceConfigs'),

  availablePropConfigs: Ember.computed.setDiff('allPropConfigs', 'propConfigs'),

  hasAvailablePropConfigs: Ember.computed.notEmpty('availablePropConfigs'),

  availableNodeConfigs: Ember.computed.alias('allNodeConfigs'),

  hasAvailableNodeConfigs: Ember.computed.notEmpty('availableNodeConfigs'),

  inserted: Ember.on('didInsertElement', function() {
    this.get('resizeService').on('debouncedDidResize', this, this.didResize);
    Ember.run.next(this, 'didResize');
  }),

  willDestroy: Ember.on('willDestroyElement', function() {
    this.get('resizeService').off('debouncedDidResize', this, this.didResize);
  }),

  didResize() {
    const w = this.$().find('.app-chart-container').width();
    var width = this.get('w');
    if ( w !== width ) {
      this.set('chartWidth', w);
      console.log(`width: ${window.innerWidth}, height: ${window.innerHeight}, chartWidth: ${w}`);
    }
  },

  actions: {
    toggleUsePeriod() {
      this.toggleProperty('isUsePeriod');
    },

    toggleSettingsVisibility() {
      this.toggleProperty('isSettingsVisible');
      this.get('chart').save();
      Ember.run.next(this, 'didResize');
    },

    togglePropertyVisibility(prop) {
      this.get('chart.properties').then(propConfigs => {
        const propConfig = propConfigs.findBy('id', prop.get('id'));
        if ( propConfig ) {
          propConfig.toggleProperty('isHidden');
        }
      });
    },

    setPropertyColor(prop, color) {
      this.get('chart.properties').then(propConfigs => {
        const propConfig = propConfigs.findBy('id', prop.get('id'));
        if ( propConfig ) {
          propConfig.set('color', color);
        }
      });
    },

    addNewProperty(propConfigId) {
      const chart = this.get('chart');
      const allPropConfigs = this.get('allPropConfigs');
      const propConfigs = this.get('propConfigs');
      const propConfig = allPropConfigs.findBy('id', propConfigId);
      if ( propConfig && !propConfigs.contains(propConfig) ) {
        propConfigs.pushObject(propConfig);
        propConfig.save();
        chart.save();
      }
    },

    removeProperty(propConfigId) {
      const chart = this.get('chart');
      const propConfigs = this.get('propConfigs');
      const propConfig = propConfigs.findBy('id', propConfigId);
      if ( propConfig ) {
        propConfigs.removeObject(propConfig);
        propConfig.save();
        chart.save();
      }
    },

    addNewGroupedSourceProperty(groupConfigId, propConfigId) {
      this.send('addNewProperty', propConfigId);
      const chart = this.get('chart');
      const propConfig = this.get('propConfigs').findBy('id', propConfigId);
      const groupConfig = chart.get('groups').findBy('id', groupConfigId);
      if ( propConfig && groupConfig ) {
        var sourceId = propConfig.get('source');
        var groupSourceIds = groupConfig.get('sourceIds').slice();
        if ( !groupSourceIds.contains(sourceId) ) {
          groupSourceIds.push(sourceId);
          groupSourceIds.sort();
          groupConfig.set('sourceIds', groupSourceIds);
          groupConfig.save();
        }
      }
    },

    removeGroupedProperty(groupConfigId, propConfigId) {
      const propConfig = this.get('propConfigs').findBy('id', propConfigId);
      const chart = this.get('chart');
      const groupConfig = chart.get('groups').findBy('id', groupConfigId);
      this.send('removeProperty', propConfigId);
      if ( propConfig && groupConfig ) {
        var sourceId = propConfig.get('source');
        var groupSourceIds = groupConfig.get('sourceIds').slice();
        var idx = groupSourceIds.indexOf(sourceId);
        if ( idx !== -1 ) {
          groupSourceIds.splice(idx, 1);
          groupConfig.set('sourceIds', groupSourceIds);
          groupConfig.save();
        }
      }
    },

    save() {
      const chart = this.get('chart');
      chart.save();
      chart.get('groups').forEach(obj => {
        obj.save();
      });
      chart.get('properties').forEach(obj => {
        obj.save();
      });
    },

    downloadData() {
      const chartConfig = this.get('chart');
      if ( chartConfig ) {
        this.eventBus.publish('ChartConfig.exportDataRequest', chartConfig.get('id'));
      }
    },
  }
});
