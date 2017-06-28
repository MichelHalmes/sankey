import React from 'react';
import ReactDOM from 'react-dom';
import request from 'superagent';

import {loadData, parseLevelData} from './utils.js'

import SankeyChart from './SankeyChart';
import Slider from '../d3_drag_drop/slider';

import bootstrap from 'bootstrap/dist/css/bootstrap.css';
import style from './sankey.css';


class App extends React.Component {
  constructor() {
    super()

    this.DATA_FILE = '../data/redshiftData.json';

    this.state = {
      nodes: [],
      links: []
    };

    this.setSplitLevel1 = this.setSplitLevel1.bind(this);
  }

  componentDidMount() {
    request
      .get(this.DATA_FILE)
      .end((err, res) => {
        if (err) { console.log('Data import error!', err); }

        this.NODES = res.body.nodes;
        this.LINKS = res.body.links;
        var {nodes, links} = parseLevelData(this.NODES, this.LINKS, null);


        this.setState({nodes, links});
    })

  }


  setSplitLevel1(element) {
    if (element.is_split) {
      var next_split_level_1 = null;
    } else {
      var next_split_level_1 = element.name;
    }

    var {nodes, links} = parseLevelData(this.NODES, this.LINKS, next_split_level_1);

    this.setState({nodes, links});
  }

  render() {
    return (
      <div>
        <SankeyChart nodes={this.state.nodes} links={this.state.links} onNodeClick={this.setSplitLevel1} />  
      </div>
    );
  }
};

// <Slider width={20} height={10} value={2} />




ReactDOM.render(<App />, document.getElementById('app'));
