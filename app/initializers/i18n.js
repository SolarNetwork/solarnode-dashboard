export function initialize(application) {
  application.inject('component', 'i18n', 'service:i18n');
}

export default {
  name: 'i18n',
  initialize: initialize
};
