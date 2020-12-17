import { configure } from '@storybook/react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons';

function loadStories() {
  require('../src/stories/index.jsx');
  require('../src/stories/buttons.jsx');
  require('../src/stories/cards.jsx');
  require('../src/stories/user-agreement.jsx');
  library.add(faAngleUp, faAngleDown);
}

configure(loadStories, module);
