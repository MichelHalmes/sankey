import React from 'react';
import ReactDOM from 'react-dom';
// import Modal from 'react-modal';
import request from 'superagent';

import {loadData} from './__old/utils.js'


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

    // this.loadLevelData = loadLevelData.bind(this);
    this.loadData = loadData.bind(this);
  }

  componentDidMount() {
    this.loadData('./emptyData.json');
    // this.loadLevelData('./levelData.json');
  }

  loadLevelData(path) {
    request
      .get(path)
      .end((err, res) => {
        if (err) { console.log(err); }

        var level_links = res.body.links;
        var level_nodes = res.body.nodes;


        level_nodes.forEach((node, i) => {

        })

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
