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

        var level_links = res.body.links;
        var level_nodes = res.body.nodes;

        var {nodes, links} = parseLevelData(level_nodes, level_links, this.state.split_level_1);
        console.log(nodes);
        console.log(links);

        this.setState({nodes, links});
      });
  }


  render() {
    return (
      <div>
        <SankeyChart nodes={this.state.nodes} links={this.state.links} openModal={this.openModal}/>
      </div>
    );
  }
};




ReactDOM.render(<App />, document.getElementById('app'));
