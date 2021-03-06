import Ember from 'ember';
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin';
import SelectableChart from '../models/selectable-chart';

export default Ember.Route.extend(AuthenticatedRouteMixin, {
  userService: Ember.inject.service(),

  model(params) {
    // note we don't do this in afterModel because we only want it invoked via direct URL, e.g. browser back button
    return Ember.RSVP.all([this.get('userService.activeUserProfile'), this.store.findRecord('chart-config', params.chartId)])
    .then(([profile, chartConfig]) => {
      return Ember.RSVP.all([chartConfig.get('properties'), profile.get('charts'), profile.get('nodes'), profile.get('chartSources'), profile.get('chartProperties')])
      .then(([chartPropConfigs, allCharts, allNodeConfigs, allSourceConfigs, allPropConfigs]) => {
        this.eventBus.publish('chartRoute.ChartLoaded', chartConfig);
        return SelectableChart.create({
          chart: chartConfig,
          profile: profile,
          propConfigs: chartPropConfigs,
          allCharts: allCharts,
          allNodeConfigs: allNodeConfigs,
          allSourceConfigs : allSourceConfigs,
          allPropConfigs : allPropConfigs,
          selected: true,
        });
      });
    });
  },

});
