/**
 * A track which shows a scale proportional to slice of the genome being
 * shown by the reference track. This track tries to show a scale in kbp,
 * mbp or gbp depending on the size of the view and also tries to round the
 * scale size (e.g. prefers 10bp, 100bp, 200bp over 13bp, 104bp, 232bp)
 *
 *           ---------- 30 chars ----------
 *
 * @flow
 */
'use strict';

var React = require('./react-shim'),
    _ = require('underscore'),
    d3 = require('d3'),
    EmptySource = require('./EmptySource'),
    types = require('./react-types'),
    d3utils = require('./d3utils');

class ScaleTrack extends React.Component {
  constructor(props: Object) {
    super(props);
    this.state = {
      labelSize: {height: 0, width: 0}
    };
  }

  getScale() {
    return d3utils.getTrackScale(this.props.range, this.props.width);
  }

  render(): any {
    return <div ref='container'></div>;
  }

  componentDidMount() {
    var div = this.getDOMNode(),
        svg = d3.select(div).append('svg');

    svg.append('line').attr('class', 'scale-lline');
    svg.append('line').attr('class', 'scale-rline');

    var label = svg.append('text').attr('class', 'scale-label');
    var {height, width} = label.text("100 mb").node().getBBox();
    // Save the size information for precise calculation
    this.setState({
          labelSize: {height: height, width: width}
    });

    this.updateVisualization();
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    this.updateVisualization();
  }

  getDOMNode(): any {
    return this.refs.container.getDOMNode();
  }

  // This formatting follows IGV's conventions regarding range display:
  //  "1 bp", "101 bp", "1,001 bp", "1,001 kbp", ...
  formatRange(viewSize: number): any {
    var tmpViewSize = viewSize / 1000,
        fprefix = d3.formatPrefix(tmpViewSize < 1 ? 1 : tmpViewSize),
        unit = fprefix.symbol + "bp",  // bp, kbp, Mbp, Gbp
        prefix = d3.format(',f.0')(fprefix.scale(viewSize));
    return {prefix, unit};
  }

  updateVisualization() {
    var div = this.getDOMNode(),
        range = this.props.range,
        width = this.props.width,
        height = this.props.height,
        labelSize = this.state.labelSize,
        svg = d3.select(div).select('svg');

    svg.attr('width', width).attr('height', height);
    var scale = this.getScale();
    var midPoint = (range.stop + range.start + 1) / 2,
        viewSize = range.stop - range.start + 1,
        midX = width / 2,
        midY = height / 2;

    var {prefix, unit} = this.formatRange(viewSize);

    var midLabel = svg.select('.scale-label');
    var labelHeight = labelSize.height,
        labelWidth = labelSize.width;
    var labelPadding = labelWidth;
    midLabel
      .attr({
        x: midX,
        y: midY
      })
      .text(prefix + " " + unit);

    var lineStart = 0,
        lineEnd = width;

    var leftLine = svg.select('.scale-lline');
    leftLine
      .transition()
      .attr({
        x1: lineStart,
        y1: midY,
        x2: midX - labelPadding,
        y2: midY
      });

    var rightLine = svg.select('.scale-rline');
    rightLine
      .transition()
      .attr({
        x1: midX + labelPadding,
        y1: midY,
        x2: lineEnd,
        y2: midY
      });
  }
}

ScaleTrack.propTypes = {
  range: types.GenomeRange.isRequired,
  onRangeChange: React.PropTypes.func.isRequired,
};
ScaleTrack.displayName = 'scale';
ScaleTrack.defaultSource = EmptySource.create();


module.exports = ScaleTrack;
