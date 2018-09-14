# Windmill data portal

A generic data portal that supports some basic interaction with [gdcapi](https://github.com/uc-cdis/gdcapi/) and [user-api](https://github.com/uc-cdis/user-api).

## Get Started

### Prerequisites

- [npm](https://www.npmjs.com/)

### Installing
```
npm install
```

Then, update schema from gdcapi by running `npm run-script schema`.
This command will update the latest schema that is used by Relay and GraphiQL.
Without parameter, it will point to the endpoint at local API (http://localhost:5000/v0/submission/getschema).
Use the parameter to point to remote url (e.g. https://dev.bionimbus.org/api/v0/submission/getschema) as follow:
```
npm run-script schema -- https://dev.bionimbus.org/api/v0/submission/getschema
```

### Running
To run for development:
```
export NODE_ENV=dev
export MOCK_STORE=true
npm run schema
npm run relay
npm run params
./node_modules/.bin/webpack-dev-server --hot
```
Then browse to http://localhost:8080/webpack-dev-server/ . Since we are running it without APIs, this will only render static pages but any submission actions to APIs will fail.

To run Storybook:
`npm run storybook`

To run with Arranger components:
1. Set local environment variables:
  - $STORYBOOK_ARRANGER_API: localhost:3000
  - $STORYBOOK_PROJECT_ID: search
  - $REACT_APP_ARRANGER_API: /api/v0/flat-search
  - $REACT_APP_PROJECT_ID: search
2. Run ElasticSearch at localhost:9200
3. Clone and `cd` into `gen3-arranger`. Run:
```cd Docker/Stacks
docker-compose -f esearch.yml up -d
export ESHOST=localhost:9200
source esearch/indexSetup.sh
es_indices
es_delete_all
es_setup_index
es_gen_data 0 20
```
4. Follow the [Arranger](https://github.com/overture-stack/arranger) setup steps - run the server and the dashboard.
5. At the Arranger Dashboard (localhost:6060), add a new version called 'dev'.
6. Click on 'dev' and add a new index. Name: subject, Index: gen3-dev-subject, ES Type: subject.
7. Go back to Versions and hit the lightning bolt. The endpoint should go from a red arrow to a green arrow.
8. At this point, running the Data Portal from our Storybook should work.

### Docker Build for Local Development
Build the container image first
```
docker build -t windmill .
```

Then run the container
```
docker run --rm -e HOSTNAME=dev.example.net -e APP=dev -p 443:443 -ti windmill
```

You will then need to visit `https://localhost` and accept the self-signed certificate warnings

### Deployment
docker run -d --name=dataportal -p 80:80 quay.io/cdis/data-portal

### GraphQL configuration
All the configurations of Homepage and Explorer page are specified src/parameters.json. For each common, we need to specify the following json entities:
```
"<common_name>": {
  "boardCounts": [
    {
      "graphql": "_case_count",
      "name": "Case",
      "plural": "Cases"
    },
    {
      "graphql": "_experiment_count",
      "name": "Experiment",
      "plural": "Experiments"
    },
    {
      "graphql": "_aliquot_count",
      "name": "Aliquot",
      "plural": "Aliquots"
    }
  ],
  "chartCounts": [
    {
      "graphql": "_case_count",
      "name": "Case"
    },
    {
      "graphql": "_experiment_count",
      "name": "Experiment"
    },
    {
      "graphql": "_aliquot_count",
      "name": "Aliquot"
    }
  ],
  "projectDetails": "boardCounts"
}

```
- `boardCounts` are the counts that you want to display in the top-left of dashboard's
- `chartCounts` are the counts that you want to display in the bar chart of dashboard's
- `projectDetails` are the counts that you want to display in the list of projects. It could be same as `boardCounts`, in this case, you only need to point to `boardCounts`.

### Style Guide
When styling components, we adhere to a few rules. We style using class selectors (`.class-name` instead of `#class-name`), and separate class names with hypens instead of camel case (`.class-name` instead of `.className`). The CSS file should be named {component}.css, and be in the same folder as the component. It is then imported into the component's .jsx file.

We are moving toward using the [BEM methodology](http://getbem.com/introduction/) in terms of CSS organizational conventions. This means we are dividing chunks of code within a component into blocks, are avoiding nesting components, and are using the naming convention of `{block}__{elements}--{modifer}`. `{element}` and `{modifier}` are optional depending on the situation - see the [BEM guidelines](http://getbem.com/introduction/) for more examples.

For our example, say we have a simple component called `Component`:
```
import './Component.css';

class Component extends React.Component {
  render() {
    return (
      <div>
        <h1>This is my component</h1>
        <button>Submit</button>
        <button>Cancel</button>
      </div>
    );
  }
}
```
Our block would be `.component`, and elements in that block would consist of the buttons and the title. So our CSS would look like this, based on the BEM naming conventions:

```
.component { }
.component__title { }
.component__button { }
```

And the code would look like this:

```
import './Component.css';

class Component extends React.Component {
  render() {
    return (
      <div className="component">
        <h1 className="component__title">This is my component</h1>
        <button className="component__button">Submit</button>
        <button className="component__button">Cancel</button>
      </div>
    );
  }
}
```

The buttons can also have modifiers - let's say we want two different colors depending on if the button is a submit button or a cancel button. Then our CSS and code would look something like this, respectively:

```
.component { }
.component__title { }
.component__button { }
.component__button--submit {
  color: blue;
}
.component__button--cancel {
  color: red;
}
```

```
import './Component.css';

class Component extends React.Component {
  render() {
    return (
      <div className="component">
        <h1 className="component__title">This is my component</h1>
        <button className="component__button component__button--submit">Submit</button>
        <button className="component__button component__button--cancel">Cancel</button>
      </div>
    );
  }
}
```
