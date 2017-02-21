import React from 'react';
import request from 'superagent';


function loadData(path) {
  request
    .get(path)
    .end((err, res) => {
      if (err) { console.log(err); }

      var links = res.body.links;
      var nodes = res.body.nodes.map((node, i) => {
        if (!node.node) { node.node = i; }
        return node
      });

      this.setState({nodes, links});
    });
}


function parseLevelData(level_nodes, level_links, split_level_1){

  "Parse nodes"
  var node_map = new Map();
  var node_count = -1;
  var prev_level_1 = null;
  level_nodes.sort((a,b) => a.level_1.localeCompare(b.level_1));
  level_nodes.forEach(function(node) {
    if(node.level_1 == split_level_1) {
      node_count++;
      node_map.set(node.level_0, {node: node_count, name: node.level_0});
    } else {
      if (node.level_1 != prev_level_1) {
        node_count++;
        prev_level_1 = node.level_1;
      }
      node_map.set(node.level_0, {node: node_count, name: node.level_1});
    }
  });

  var nodes = Array.from(node_map.values())
    .filter((thing, index, self) => index === self.findIndex((t) => {
      return t.node === thing.node && t.name === thing.name; })
    );

  // Parse links
  level_links = level_links.map(function(link) {
    var source = node_map.get(link.source_0);
    var target = node_map.get(link.target_0);
    return {source: source.node, target: target.node, value : link.value}
  });

  level_links = level_links.filter((link) => link.source != link.target)
    .sort(function (a, b) {
      return a.source - b.source || a.target - b.target;
  });


  var links = level_links.reduce(function (acc, curr, idx) {
    var prev = level_links[idx-1] || {source: -1, target: -1};
    if (curr.source == prev.source && curr.target == prev.target) {
      acc[acc.length - 1].value += curr.value;
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);

  return {nodes, links}
}

export { loadData, parseLevelData }
