import Ember from 'ember';
import d3 from 'npm:d3';
import sn from 'npm:solarnetwork-d3';

const ConfigurationAccessor = {
  get(key) {
    const chartConfiguration = this.get('chartConfiguration');
    return chartConfiguration.value(key);
  },
  set(key, value) {
    const chartConfiguration = this.get('chartConfiguration');
    return chartConfiguration.value(key, value);
  }
};

export default Ember.Component.extend({
  tagName: 'svg',
  attributeBindings: ['width', 'height'],
  classNames: ['app-chart', 'app-chart-stream'/*, 'uk-responsive-width'*/],
  chartHelper: Ember.inject.service(),

  aggregate: Ember.computed('chartConfiguration', ConfigurationAccessor),

  data: undefined, // array of data groups to load
  chartConfig: undefined, // a ChartConfig object
  prop: 'watts',

  snConfiguration: null,

  refreshTimer : null,
  refreshInterval : (5*60*1000),

  chartConfiguration : Ember.computed(function() {
    var conf = this.get('snConfiguration');
    if ( !conf ) {
      conf = new sn.Configuration({
        width: this.get('width'),
        height: this.get('height')
      });
      this.set('snConfiguration', conf);
    }
    return conf;
  }),

  // chart: should be implemented in extending classes

  chartConfigurationChanged: Ember.observer('chart', 'data', function() {
    Ember.run.once(this, 'draw');
  }),

  widthHeightChanged: Ember.observer('width', 'height', function() {
    Ember.run.once(this, function() {
      const chartConfiguration = this.get('chartConfiguration');
      chartConfiguration.value('width', this.get('width'));
      chartConfiguration.value('height', this.get('height'));
    });
  }),

  chartConfigChanged: Ember.on('init', Ember.observer('chartConfig', 'chartConfig.isUsePeriod', 'chartConfig.period',
      'chartConfig.periodAggregate', 'chartConfig.startDate', 'chartConfig.endDate', 'chartConfig.aggregate', function() {
    Ember.run.once(this, function() {
      const chart = this.get('chart');
      const chartConfig = this.get('chartConfig');
      if ( chartConfig ) {
        const isUsePeriod = chartConfig.get('isUsePeriod');
        var refreshTimer = this.get('refreshTimer');
        if ( isUsePeriod ) {
          this.set('aggregate', chartConfig.get('periodAggregate'));
          if ( !refreshTimer ) {
            refreshTimer = Ember.run.later(this, 'refreshDataFromChartConfig', this.get('refreshInterval'));
            this.set('refreshTimer', refreshTimer);
          }
        } else {
          this.set('aggregate', chartConfig.get('aggregate'));
          if ( refreshTimer ) {
            Ember.run.cancel(refreshTimer);
            this.set('refreshTimer', null);
          }
        }
        const chartConfiguration = this.get('chartConfiguration');
        this.loadDataFromChartConfig();
      }
    });
  })),

  willDestroy: Ember.on('willDestroyElement', function() {
    const refreshTimer = this.get('refreshTimer');
    if ( refreshTimer ) {
      Ember.run.cancel(refreshTimer);
    }
  }),

  inserted: Ember.on('didInsertElement', function() {
    if ( this.get('chartConfig') ) {
      this.loadDataFromChartConfig();
    } else {
      this.draw();
    }
  }),

  refreshDataFromChartConfig() {
    this.loadDataFromChartConfig();
    var refreshTimer = Ember.run.later(this, 'refreshDataFromChartConfig', this.get('refreshInterval'));
    this.set('refreshTimer', refreshTimer);
  },

  loadDataFromChartConfig() {
    const chartConfig = this.get('chartConfig');
    const helper = this.get('chartHelper');
    if ( chartConfig && helper ) {
      helper.dataForChart(chartConfig).then(data => {
        if ( !(this.isDestroyed || this.isDestroying) ) {
          this.set('data', data);
        }
      });
    }
  },

  draw() {
    // extending classes should implement
  }

});
