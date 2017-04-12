import React from 'react';
import request from 'superagent';

var MIN_LINK_VALUE = 50;

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
  var node_map = parseLevelNodes(level_nodes, split_level_1);

  var nodes = Array.from(node_map.values())
    .filter((thing, index, self) => index === self.findIndex((t) => {
      return t.node === thing.node && t.name === thing.name; })
    );

  var links = parseLevelLinks(level_links, node_map, split_level_1);

  return {nodes, links}
}

function parseLevelNodes(level_nodes, split_level_1) {
  var node_map = new Map();
  var node_count = -1;
  var prev_level_1 = null;
  level_nodes.sort((a,b) => a.level_1.localeCompare(b.level_1));
  level_nodes.forEach(function(node) {
    if(node.level_1 == split_level_1) {
      node_count++;
      node_map.set(node.level_0, {node: node_count, name: node.level_0, source_value: 0, target_value: 0, is_split: true});
    } else {
      if (node.level_1 != prev_level_1) {
        node_count++;
        prev_level_1 = node.level_1;
      }
      node_map.set(node.level_0, {node: node_count, name: node.level_1, source_value: 0, target_value: 0});
    }
  });

  return node_map;
}

function parseLevelLinks(level_links, node_map, split_level_1) {
  level_links = level_links.map(function(link) {
    var source = node_map.get(link.source_0);
    if (!source){
      console.log(`The link '${link}'' has the source '${link.source_0}' unspecified in the nodes`);
      return {delete: true}; // Will be filtered
    }
    var target = node_map.get(link.target_0);
    if (!target){
      console.log(`The link '${link}'' has the target '${link.target_0}' unspecified in the nodes`);
      return {delete: true}; // Will be filtered
    }

    if (!split_level_1 || source.is_split || target.is_split) {
      source.source_value+= link.value;
      target.target_value+= link.value;
      return {source: source, target: target, value : link.value}
    } else {
      return {delete: true}; // Will be filtered
    }
  });

  level_links = level_links.filter((link) => (
    !link.delete  && link.source.node != link.target.node
    && link.value > 100
    && (link.value > 0.1*link.source.source_value || link.value > 0.1*link.target.target_value))
  )
  .map((link) => ({source: link.source.node, target: link.target.node, value: link.value}) )
  .sort((a, b) =>  a.source - b.source || a.target - b.target);


  var links = level_links.reduce(function (acc, curr, idx) {
    var prev = level_links[idx-1] || {source: -1, target: -1};
    if (curr.source == prev.source && curr.target == prev.target) {
      acc[acc.length - 1].value += curr.value;
    } else {
      acc.push(curr);
    }
    return acc;
  }, []);

  return links;

}

export { loadData, parseLevelData }
