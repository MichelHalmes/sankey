import React from 'react';
import ReactDOM from 'react-dom';
import request from 'superagent';

import {loadData, parseLevelData} from './utils.js'

import SankeyChart from './SankeyChart';

import bootstrap from 'bootstrap/dist/css/bootstrap.css';
import style from './sankey.css';


class App extends React.Component {
  constructor() {
    super()

    this.state = {
      nodes: [],
      links: [],
      split_level_1: null
    };

    this.loadData = loadData.bind(this);

    this.loadLevelData = this.loadLevelData.bind(this);
    this.setSplitLevel1 = this.setSplitLevel1.bind(this);
  }

  componentDidMount() {
    this.loadData('./emptyData.json');
    this.loadLevelData('./levelData.json');
  }

  loadLevelData(path) {
    request
      .get(path)
      .end((err, res) => {
        if (err) { console.log('Data import error!', err); }

        var {nodes, links} = parseLevelData(res.body.nodes, res.body.links, this.state.split_level_1);

        this.setState({nodes, links});
      });
  }

  setSplitLevel1(element) {
    console.log('%O', element);
    if (element.is_split) {
      this.setState({split_level_1: null});
    } else {
      this.setState({split_level_1: element.name});
    }

    this.loadLevelData('./levelData.json');
  }

  render() {
    return (
      <div>
        <SankeyChart nodes={this.state.nodes} links={this.state.links} onNodeClick={this.setSplitLevel1}/>
      </div>
    );
  }
};




ReactDOM.render(<App />, document.getElementById('app'));
