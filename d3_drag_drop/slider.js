import d3 from 'd3'
import React from 'react'
import ReactFauxDOM from 'react-faux-dom'

class Slider extends React.Component {


  render() {
    const {width, height, value} = this.props

    var svgNode = ReactFauxDOM.createElement('div');

    var svg = d3.select(svgNode).append("svg")
        .attr('width',width)
        .attr('height',height)

    svg.call(d3.behavior.drag()
        .origin(function(d) {
          console.log('orig', d)
          return svg;
        })
        .on("dragstart", function() { this.parentNode.appendChild(this); })
        .on("drag", handleDrag))

    svg.append("rect")
        .attr('width',width*value)
        .attr('height',height)
        .attr('class',"Slider-fill")


    svg.append("rect")
      .attr('width',width)
      .attr('height',height)
      .attr('class',"Slider-border")

    svg.append("text")
      .attr('x',width/2)
      .attr('y',height/2)
      .text(value)



    function handleDrag(d) {
      console.log('drag')
      console.log(d.dx, d.dy, d.x, d.y);
      d3.select(this).attr("transform",
          "translate(" + (
          	   d.x = Math.max(0, Math.min(width - d.dx, d3.event.sourceEvent.x))
          	) + "," + (
                     d.y = Math.max(0, Math.min(height - d.dy, d3.event.sourceEvent.y))
              ) + ")");
    }


    return svgNode.toReact();
  }
}

export default Slider
