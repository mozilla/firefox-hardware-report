import $ from 'jquery';
import MG from 'metrics-graphics';

// jQuery UI
import 'jquery-ui/ui/effect';
import 'jquery-ui/ui/effects/effect-shake';

// d3
import 'd3-transition';
import { curveCatmullRom as d3CurveCatmullRom } from 'd3-shape';
import { event as d3Event, select as d3Select, selectAll as d3SelectAll } from 'd3-selection'
import { json as d3Json } from 'd3-request';
import { scaleLinear as d3ScaleLinear } from 'd3-scale';
import { timeFormat as d3TimeFormat } from 'd3-time-format';


$(document).ready(function() {
  'use strict'

  var x_scale_stacked_bar;

  var color = new Object();
  color['Intel'] = '#2bacfb';
  color['AMD'] = '#f44d29';
  color['NVIDIA'] = '#31d620',
  color['Win_7'] = '#fd9213',
  color['Win_10'] = '#fdb813',
  color['Win_XP'] = '#fdd413',
  color['Win_8-1'] = '#fdf513',
  color['macOS'] = '#75cbff',
  color['Other'] = '#454545',
  color['Has_Flash'] = '#b4b4b4',
  color['No_Flash'] = '#f1f1f1';

  var global = {
    interpolate: d3CurveCatmullRom.alpha(0.5),
    heroIndex: 0,
    formatter: d3TimeFormat("%B %e, %Y"),
    chart: {
      width: 400,
      height: 660,
      left: 0,
      right: 120,
      xax_count: 4
    },
    ignoredGpuVendors: {
      'Intel': false,
      'NVIDIA': false,
      'AMD': false,
    },

    // Mappings:
    // Darwin: https://en.wikipedia.org/wiki/Darwin_(operating_system)#Release_history
    osNice: {
      'osName_Windows_NT-6.1': 'Windows 7',
      'osName_Windows_NT-10.0': 'Windows 10',
      'osName_Windows_NT-5.1': 'Windows XP',
      'osName_Windows_NT-6.3': 'Windows 8.1',
      'osName_Windows_NT-Other': 'Windows Other',
      'osName_Darwin-Other': 'macOS Other',
      'osName_Windows_NT-6.0': 'Windows Vista',
      'osName_Linux-Other': 'Linux',
      'osName_Windows_NT-6.2': 'Windows 8',
      'osName_Darwin-14.5.0': 'macOS Yosemite',
      'osName_Darwin-15.6.0': 'macOS El Capitan',
      'osName_Darwin-16.5.0': 'macOS Sierra',
      'osName_Darwin-17.4.0': 'macOS High Sierra',
      'osName_Other': 'Other',
    },

    gpuModelNice: {
      'gpuModel_gen7.5-haswell-gt2': {nice: 'Haswell (GT2)', vendor: 'Intel'},
      'gpuModel_gen7-ivybridge-gt2': {nice: 'Ivy Bridge (GT2)', vendor: 'Intel'},
      'gpuModel_gen6-sandybridge-gt2': {nice: 'Sandy Bridge (GT2)', vendor: 'Intel'},
      'gpuModel_gen6-sandybridge-gt1': {nice: 'Sandy Bridge (GT1)', vendor: 'Intel'},
      'gpuModel_gen7-ivybridge-gt1': {nice: 'Ivy Bridge (GT1)', vendor: 'Intel'},
      'gpuModel_gen4.5-gma4500hd': {nice: 'GMA 4500HD', vendor: 'Intel'},
      'gpuModel_gen5-ironlake': {nice: 'Ironlake', vendor: 'Intel'},
      'gpuModel_gen7-baytrail': {nice: 'Bay Trail', vendor: 'Intel'},
      'gpuModel_gen4.5-gma4500': {nice: 'GMA 4500', vendor: 'Intel'},
      'gpuModel_gen8-broadwell-gt2': {nice: 'Broadwell (GT2)', vendor: 'Intel'},
      'gpuModel_gen3-gma3100': {nice: 'GMA 3100', vendor: 'Intel'},
      'gpuModel_gen3-gma950': {nice: 'GMA 950', vendor: 'Intel'},
      'gpuModel_gen7.5-haswell-gt21': {nice: 'Haswell (GT21)', vendor: 'Intel'},
      'gpuModel_gen7-ivybridge-gt22': {nice: 'Ivy Bridge (GT22)', vendor: 'Intel'},
      'gpuModel_gen6-sandybridge-gt23': {nice: 'Sandy Bridge (GT23)', vendor: 'Intel'},
      'gpuModel_gen6-sandybridge-gt14': {nice: 'Sandy Bridge (GT14)', vendor: 'Intel'},
      'gpuModel_gen7-ivybridge-gt15': {nice: 'Sandy Bridge (GT15)', vendor: 'Intel'},
      'gpuModel_gen4.5-gma4500hd6': {nice: 'GMA 4500HD 6', vendor: 'Intel'},
      'gpuModel_gen5-ironlake7': {nice: 'Ironlake', vendor: 'Intel'},
      'gpuModel_gen7-baytrail8': {nice: 'Bay Trail 8', vendor: 'Intel'},
      'gpuModel_gen4.5-gma45009': {nice: 'GMA 4500 9', vendor: 'Intel'},
      'gpuModel_gen8-broadwell-gt210': {nice: 'Broadwell (GT 210)', vendor: 'Intel'},
      'gpuModel_gen3-gma310011': {nice: 'GMA 310011', vendor: 'Intel'},
      'gpuModel_EVERGREEN-PALM': {nice: 'Evergreen (Palm)†', vendor: 'AMD'},
      'gpuModel_gen9-skylake-gt2': {nice: 'Skylake (GT2)', vendor: 'Intel'},
      'gpuModel_EVERGREEN-CEDAR': {nice: 'Evergreen (Cedar)†', vendor: 'AMD'},
      'gpuModel_CAYMAN-ARUBA': {nice: 'Cayman (Aruba)†', vendor: 'AMD'},
      'gpuModel_gen4-gma3500': {nice: 'GMA 3500', vendor: 'Intel'},
      'gpuModel_Tesla-GT218': {nice: 'GeForce GT218*', vendor: 'NVIDIA'},
      'gpuModel_NV40-C61': {nice: 'GeForce NV40*', vendor: 'NVIDIA'},
      'gpuModel_gen7.5-haswell-gt3': {nice: 'Haswell (GT3)', vendor: 'Intel'},
      'gpuModel_gen7.5-haswell-gt1': {nice: 'Haswell (GT1)', vendor: 'Intel'},
      'gpuModel_EVERGREEN-TURKS': {nice: 'Evergreen (Turks)†', vendor: 'AMD'}
    }
  };

  var mouseover = function(target) {
    return function() {
      //reduce opacity of all other lines but this one
      var hiding_these = '';
      var r = /\d+/;

      d3SelectAll(target + ' .mg-line-rollover-circle').nodes().forEach(
        function(d) {
          if (d3Select(d).style('opacity') === '0' || d3Select(d).attr(
            'r') === '0') {
            var line_id = d.classList[0].match(r);
            hiding_these += 'path.mg-line' + line_id + ',';
            hiding_these += '.mg-line-legend .mg-line' + line_id +
              '-legend-color,';
          }
        });

      d3Select(target).selectAll(hiding_these.slice(0, -1))
        .style('opacity', '0.3');

      //update color of hover text with vendor color if applicable
      d3Select(target).selectAll('.mg-active-datapoint tspan tspan')
        .style('fill', 'white');
    }
  }

  var mouseout = function(target) {
    return function() {
      d3Select(target).selectAll('path, .mg-line-legend text')
        .style('opacity', '1');
    }
  }

  /**
   * Enable keyboard navigation for the summary charts. The left arrow key moves
   * the charts backward in time and the right arrow key moves the charts
   * forward in time.
   */
  document.onkeydown = function(e) {
    e = e || window.event;

    switch(e.which || e.keyCode) {
      case 37: // Left arrow key
        navigateHero('backward', document.getElementById('hero-backward'));
        break;

      case 39: // Right arrow key
        navigateHero('forward', document.getElementById('hero-forward'));
        break;

      default:
        return;
    }
  }

  /**
   * When the value of the select box near the top of the page changes,
   * re-render the summary charts and update heroIndex so that the navigational
   * buttons continue to work as expected.
   */
  $('#date-select-box').on('change', function() {
    var selectedDate = new Date(this.value + 'T00:00:00');

    // Find the dataset that matches the selected date
    for (var i = 0; i < global.data.length; i++) {
      var currentDate = global.data[i].date;
      if (currentDate.getTime() === selectedDate.getTime()) {
        global.heroIndex = i;
        break;
      }
    }

    drawHeroCharts(global.data[global.heroIndex]);
  });

  function reorderCharts(section) {
    if (section == 'all') {
      d3SelectAll('.chart').style('display', 'block');
      return;
    }

    d3SelectAll('.chart')
      .style('display', 'none');

    d3SelectAll('.chart.' + section)
      .style('display', 'block');
  }

  function drawHeroCharts(data_this_month) {
    var data_cpu = [{
      key: 'Intel',
      value: data_this_month.cpuVendor_GenuineIntel
    }, {
      key: 'AMD',
      value: data_this_month.cpuVendor_AuthenticAMD
    }];
    heroChart(data_cpu, '#processor');

    var data_gpu = [{
      key: 'Intel',
      value: data_this_month.gpuVendor_Intel
    }, {
      key: 'AMD',
      value: data_this_month.gpuVendor_AMD
    }, {
      key: 'NVIDIA',
      value: data_this_month.gpuVendor_NVIDIA
    }];
    heroChart(data_gpu, '#pc-video-card');

    var data_os = [{
      key: 'Win_7',
      value: data_this_month['osName_Windows_NT-6.1']
    }, {
      key: 'Win_10',
      value: data_this_month['osName_Windows_NT-10.0']
    }, {
      key: 'Win_XP',
      value: data_this_month['osName_Windows_NT-5.1']
    }, {
      key: 'Win_8-1',
      value: data_this_month['osName_Windows_NT-6.3']
    }, {
      key: 'macOS',
      value: data_this_month['osName_Darwin']
    }];
    heroChart(data_os, '#operating-systems');

    var data_flash = [{
      key: 'Has_Flash',
      value: data_this_month.hasFlash_True
    }, {
      key: 'No_Flash',
      value: data_this_month.hasFlash_False
    }];
    heroChart(data_flash, '#flash');
  }

  function heroChart(data, target) {
    //do we need an 'Other' property?
    var sum = 0;
    data.forEach(function(d) {
      sum += d.value;
    });

    if (sum < 1) {
      data.push({
        key: 'Other',
        value: 1 - sum
      });
    }

    var width = 450,
      height = 90,
      x_padding_left = 0,
      x_padding_right = 30,
      bar_y_position = 15,
      bar_height = 22;

    x_scale_stacked_bar = d3ScaleLinear()
      .domain([0, 1])
      .range([0, width - x_padding_right]);

    var svg = d3Select(target).select('svg');
    var rects = svg.selectAll('rect.bar');
    var x_marker = 0;

    var isoDateFormatter = d3TimeFormat('%Y-%m-%d');
    d3Select('#date-select-box').property('value', isoDateFormatter(global.data[global.heroIndex].date));

    //updating?
    if (rects.nodes().length > 0) {
      rects.data(data)
        .transition()
        .duration(500)
        .attr('width', function(d) {
          return (d.value == undefined) ? x_scale_stacked_bar(0) :
            x_scale_stacked_bar(d.value).toFixed(1);
        })
        .attr('x', function(d) {
          if (d.value == undefined) d.value = 0;

          var x_marker_this = x_marker;
          x_marker += d.value;

          //append circle
          svg.select('circle.tippy_' + d.key)
            .attr('cx', function() {
              return x_padding_left + x_scale_stacked_bar(
                x_marker_this + ((x_marker - x_marker_this) / 2));
            })
            .attr('cy', bar_y_position + bar_height - 3);

          //append text labels
          svg.select('text.tippytext_' + d.key)
            .attr('x', function() {
              return x_padding_left + x_scale_stacked_bar(
                x_marker_this + ((x_marker - x_marker_this) / 2));
            })
            .attr('y', function() {
              return bar_y_position + bar_height + 22;
            })
            .text(function() {
              var label = d.key.replace(/_/g, ' ').replace(/-/g, '.');

              return label + ' (' + Math.round(d.value * 100) + '%)';
            });

          return x_padding_left + x_scale_stacked_bar(x_marker_this);
        })

      return;
    }

    svg.attr('width', width)
      .attr('height', height);

    svg.attr('viewBox', '0 0 450 90')
      .attr('preserveAspectRatio', 'xMinYMin meet');

    //add stacked bar chart
    rects.data(data).enter().append('rect')
      .attr('class', function(d) {
        return 'bar bar_' + d.key;
      })
      .attr('width', function(d) {
        return (d.value == undefined) ? x_scale_stacked_bar(0) :
          x_scale_stacked_bar(d.value).toFixed(1);
      })
      .attr('x', function(d) {
        if (d.value == undefined) d.value = 0;

        var x_marker_this = x_marker;
        x_marker += d.value;

        //append circle
        svg.append('circle')
          .attr('r', 8)
          .attr('class', function() {
            return 'tippy tippy_' + d.key;
          })
          .attr('cx', function() {
            return x_padding_left + x_scale_stacked_bar(
              x_marker_this + ((x_marker - x_marker_this) / 2));
          })
          .attr('cy', bar_y_position + bar_height - 3)
          .style('fill', function() {
            return color[d.key];
          })
          .style('opacity', function() {
            if (d.value < 0.04)
              return 0;
          });

        //append text labels
        svg.append('text')
          .attr('class', function() {
            return 'tippytext tippytext_' + d.key;
          })
          .attr('text-anchor', 'middle')
          .attr('x', function() {
            return x_padding_left + x_scale_stacked_bar(
              x_marker_this + ((x_marker - x_marker_this) / 2));
          })
          .attr('y', function() {
            return bar_y_position + bar_height + 22;
          })
          .text(function() {
            var label = d.key.replace(/_/g, ' ').replace(/-/g, '.');

            return label + ' (' + Math.round(d.value * 100) + '%)';
          })
          .style('fill', function() {
            return 'white';
          });

        return x_padding_left + x_scale_stacked_bar(x_marker_this);
      })
      .attr('y', function(d) {
        return bar_y_position;
      })
      .attr('height', function(d) {
        return bar_height;
      })
      .style('fill', function(d) {
        return color[d.key];
      })
      .style('display', function(d, i) {
        if (i == 0) {
          $(target + ' .tippy').hide();
          $(target + ' .tippy_' + d.key).show();

          $(target + ' .tippytext').hide();
          $(target + ' .tippytext_' + d.key).show();
        }
      })
      .on('click', function(d) {
        $(target + ' .tippy').hide();
        $(target + ' .tippy_' + d.key).show();

        $(target + ' .tippytext').hide();
        $(target + ' .tippytext_' + d.key).show();
      })
      .on('mouseenter', function(d) {
        $(target + ' .tippy').hide();
        $(target + ' .tippy_' + d.key).show();

        $(target + ' .tippytext').hide();
        $(target + ' .tippytext_' + d.key).show();
      });
  }

  var globalMarkers = [
      {
          'label': 'XP and Vista users move to ESR, thus leaving dataset',
          'date': new Date('2017-03-05T00:00:00'),
      },
  ];


  d3Json('https://analysis-output.telemetry.mozilla.org/game-hardware-survey/data/hwsurvey-weekly.json', function(data_gfx) {

    // The JSON was not returned or is not usable
    if (!data_gfx || !Array.isArray(data_gfx) || data_gfx.length === 0) {
      var main = document.getElementsByTagName('main')[0];

      var reports = document.getElementById('reports');
      reports.style.display = 'none';

      var div = document.createElement('div');
      div.className = 'error';

      var h2 = document.createElement('h2');
      h2.innerHTML = 'Error';

      var p = document.createElement('p');
      p.innerHTML = 'Error loading data. Wait a few minutes and trying again.';

      div.appendChild(h2);
      div.appendChild(p);
      main.appendChild(div);

    // The JSON was returned and the data is of the form we expect
    } else {

      var dates = [];
      for (var i = 0; i < data_gfx.length; i++) {
        dates.push(data_gfx[i].date);
      }

      // Descending sort
      dates.sort(function(a, b) {
        if (b < a) return -1;
        if (b > a) return 1;
        return 0;
      });

      // Populate #date-select-box with the dates available in the dataset
      d3Select('#date-select-box')
        .selectAll('option')
        .data(dates)
        .enter()
          .append('option')
          .attr('value', function(date) { return date; })
          .text(function(date) { return global.formatter(new Date(date + 'T00:00:00')); });

      data_gfx.map(function(d) {
        //consolidate Mac releases
        d['osName_Darwin'] = 0;
        d['osName_Darwin'] += d['osName_Darwin-17.4.0'] || 0;
        d['osName_Darwin'] += d['osName_Darwin-16.5.0'] || 0;
        d['osName_Darwin'] += d['osName_Darwin-15.6.0'] || 0;
        d['osName_Darwin'] += d['osName_Darwin-14.5.0'] || 0;
        d['osName_Darwin'] += d['osName_Darwin-Other'] || 0;

        //group CPU speeds
        d['grouped_cpuSpeed_1.4_or_less'] = d['cpuSpeed_1.3'];
        d['grouped_cpuSpeed_1.4_to_1.49'] = d['cpuSpeed_1.4'];
        d['grouped_cpuSpeed_1.5_to_1.69'] = d['cpuSpeed_1.5'] + d[
          'cpuSpeed_1.6'];
        d['grouped_cpuSpeed_1.7_to_1.99'] = d['cpuSpeed_1.7'] + d[
          'cpuSpeed_1.8'] + d['cpuSpeed_1.9'];
        d['grouped_cpuSpeed_2_to_2.29'] = d['cpuSpeed_2.0'] + d[
          'cpuSpeed_2.1'] + d['cpuSpeed_2.2'];
        d['grouped_cpuSpeed_2.3_to_2.69'] = d['cpuSpeed_2.3'] + d[
          'cpuSpeed_2.4'] + d['cpuSpeed_2.5'] + d['cpuSpeed_2.6'];
        d['grouped_cpuSpeed_2.7_to_2.99'] = d['cpuSpeed_2.7'] + d[
          'cpuSpeed_2.8'] + d['cpuSpeed_2.9'];
        d['grouped_cpuSpeed_3.0_to_3.29'] = d['cpuSpeed_3.0'] + d[
          'cpuSpeed_3.1'] + d['cpuSpeed_3.2'];
        d['grouped_cpuSpeed_3.3_to_3.69'] = d['cpuSpeed_3.3'] + d[
          'cpuSpeed_3.4'] + d['cpuSpeed_3.5'] + d['cpuSpeed_3.6'];
      });

      //sort by date
      MG.convert.date(data_gfx, 'date');
      data_gfx.sort(function(a, b) {
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        return 0;
      });

      // take first one and use that to build the stacked bar charts
      global.data = data_gfx;
      drawHeroCharts(global.data[global.heroIndex]);

      // update last updated date
      d3Select('.data-last-updated span')
          .html(global.formatter(global.data[0].date));

      //draw the rest of the charts
      drawCharts([data_gfx]);
    }
  });

  function topX(prefix, data) {
    var subset = [];
    Object.keys(data).forEach(function(prop) {
      if (prop.indexOf(prefix) !== -1) {
        subset.push({
          key: prop,
          value: +data[prop]
        });
      }
    });

    subset.sort(function(a, b) {
      if (a.value < b.value) return 1;
      if (a.value > b.value) return -1;
      return 0;
    });
    return subset;
  }

  function drawCharts(data) {
    var target;

    target = '#detail-processor-speed';
    MG.data_graphic({
      title: "CPU Speeds",
      data: data,
      format: 'perc',
      animate_on_load: true,
      interpolate: global.interpolate,
      width: global.chart.width,
      height: global.chart.height,
      xax_count: global.chart.xax_count,
      yax_count: 10,
      right: global.chart.right,
      target: target,
      //y_accessor: cpuSpeed_keys,
      //legend: cpuSpeed_labels,
      y_accessor: ['grouped_cpuSpeed_1.4_or_less',
        'grouped_cpuSpeed_1.4_to_1.49',
        'grouped_cpuSpeed_1.5_to_1.69',
        'grouped_cpuSpeed_1.7_to_1.99',
        'grouped_cpuSpeed_2_to_2.29',
        'grouped_cpuSpeed_2.3_to_2.69',
        'grouped_cpuSpeed_2.7_to_2.99',
        'grouped_cpuSpeed_3.0_to_3.29',
        'grouped_cpuSpeed_3.3_to_3.69',
        'cpuSpeed_Other'
      ],
      legend: ['Less than 1.4 GHz', '1.4 GHz to 1.49 GHz',
        '1.5 GHz to 1.69 GHz', '1.7 GHz to 1.99 GHz',
        '2.0 GHz to 2.29 GHz', '2.3 GHz to 2.69 GHz',
        '2.7 GHz to 2.99 GHz', '3.0 GHz to 3.29 GHz',
        '3.3 GHz to 3.69 GHz', 'Other'
      ],
      mouseover: mouseover(target),
      mouseout: mouseout(target),
      full_width: true,
      markers: globalMarkers,
    });

    var cores = topX('cpuCores_', global.data[0]);
    var cores_keys = [];
    var cores_labels = [];
    cores.forEach(function(d, i) {
      cores_keys.push(d.key);
      var nicy = d.key.replace('cpuCores_', '');

      cores_labels.push((nicy == 'Other')
        ? '3 or 8+ cores'
        : (nicy == 1)
          ? nicy + ' core'
          : nicy + ' cores');
    });
    target = '#detail-processor-cores';
    MG.data_graphic({
      title: "CPU Cores",
      data: data,
      format: 'perc',
      animate_on_load: true,
      interpolate: global.interpolate,
      width: global.chart.width,
      height: 300,
      xax_count: global.chart.xax_count,
      right: global.chart.right,
      target: target,
      y_accessor: cores_keys,
      legend: cores_labels,
      mouseover: mouseover(target),
      mouseout: mouseout(target),
      full_width: true,
      markers: globalMarkers,
    });

    target = '#detail-pc-video-card'
    MG.data_graphic({
      title: "GPU",
      data: data,
      format: 'perc',
      animate_on_load: true,
      interpolate: global.interpolate,
      width: global.chart.width,
      height: 300,
      xax_count: global.chart.xax_count,
      right: global.chart.right,
      target: target,
      full_width: true,
      mouseover: mouseover(target),
      mouseout: mouseout(target),
      max_y: 1,
      x_accesor: 'date',
      y_accessor: ['gpuVendor_Intel', 'gpuVendor_NVIDIA', 'gpuVendor_AMD'],
      legend: ['Intel', 'NVIDIA', 'AMD'],
      markers: globalMarkers,
    });

    target = '#detail-operating-systems';
    var os = topX('osName_', global.data[0]);
    var os_keys = [];
    var os_labels = [];
    os.forEach(function(d, i) {
      if (d.key == 'osName_Darwin')
        return;

      os_keys.push(d.key);
      os_labels.push(global.osNice[d.key] || d.key.replace('osName_', ''));
    });
    MG.data_graphic({
      title: "Operating System",
      data: data,
      format: 'perc',
      animate_on_load: true,
      interpolate: global.interpolate,
      width: global.chart.width,
      height: global.chart.height + 100,
      xax_count: global.chart.xax_count,
      yax_count: 10,
      right: global.chart.right,
      bottom: 100,
      target: target,
      full_width: true,
      mouseover: mouseover(target),
      mouseout: mouseout(target),
      x_accesor: 'date',
      y_accessor: os_keys,
      legend: os_labels,
      markers: globalMarkers,
    });

    target = '#detail-processor';
    MG.data_graphic({
      title: "CPU",
      data: data,
      format: 'perc',
      animate_on_load: true,
      interpolate: global.interpolate,
      width: global.chart.width,
      height: 300,
      xax_count: global.chart.xax_count,
      right: global.chart.right,
      target: target,
      full_width: true,
      mouseover: mouseover(target),
      mouseout: mouseout(target),
      max_y: 1,
      x_accesor: 'date',
      y_accessor: ['cpuVendor_GenuineIntel', 'cpuVendor_AuthenticAMD'],
      legend: ['Intel', 'AMD'],
      markers: globalMarkers,
    });

    target = '#detail-display-resolution';
    var display_resolutions = topX('resolution_', global.data[0]);
    var display_resolutions_keys = [];
    var display_resolutions_labels = [];
    display_resolutions.forEach(function(d, i) {
      display_resolutions_keys.push(d.key);
      display_resolutions_labels.push(d.key.replace('resolution_', ''));
    });
    MG.data_graphic({
      title: "Display Resolution",
      data: data,
      format: 'perc',
      animate_on_load: true,
      interpolate: global.interpolate,
      width: global.chart.width,
      height: global.chart.height,
      xax_count: global.chart.xax_count,
      yax_count: 10,
      right: global.chart.right,
      target: target,
      full_width: true,
      mouseover: mouseover(target),
      mouseout: mouseout(target),
      x_accesor: 'date',
      y_accessor: display_resolutions_keys,
      legend: display_resolutions_labels,
      markers: globalMarkers,
    });

    target = '#detail-ram';
    var ram = topX('ram_', global.data[0]);
    var ram_keys = [];
    var ram_labels = [];
    ram.forEach(function(d, i) {
      ram_keys.push(d.key);
      var nicy = d.key.replace('ram_', '');

      ram_labels.push((nicy == 'Other') ? nicy : nicy + 'GB');
    });
    MG.data_graphic({
      title: "Memory",
      data: data,
      format: 'perc',
      animate_on_load: true,
      interpolate: global.interpolate,
      width: global.chart.width,
      height: global.chart.height,
      xax_count: global.chart.xax_count,
      yax_count: 8,
      right: global.chart.right,
      target: target,
      full_width: true,
      mouseover: mouseover(target),
      mouseout: mouseout(target),
      x_accesor: 'date',
      y_accessor: ram_keys,
      legend: ram_labels,
      markers: globalMarkers,
    });

    // gives us the top gpu models
    draw_gpu_models();

    target = '#detail-browser-share-32-64';
    MG.data_graphic({
      title: "Browsers by Architecture",
      data: data,
      format: 'perc',
      animate_on_load: true,
      interpolate: global.interpolate,
      width: global.chart.width,
      height: 300,
      xax_count: global.chart.xax_count,
      right: global.chart.right,
      target: target,
      mouseover: mouseover(target),
      mouseout: mouseout(target),
      x_accesor: 'date',
      y_accessor: ['browserArch_x86', 'browserArch_x86-64'],
      legend: ['32-bit', '64-bit'],
      max_y: 1,
      full_width: true,

      // Don't show the globalMarkers here. At the time of this writing, they
      // don't add much to this chart and they take up space that we need for
      // this marker.
      markers: [{
          'label': '64-bit updates unthrottled on Win7+ for 2GB+ users',
          'date': new Date('2017-10-23T00:00:00'),
      }],
    });

    target = '#detail-browser-share-os-32-64';
    MG.data_graphic({
      title: "OSs by Architecture",
      data: data,
      format: 'perc',
      animate_on_load: true,
      interpolate: global.interpolate,
      width: global.chart.width,
      height: 300,
      xax_count: global.chart.xax_count,
      right: global.chart.right,
      mouseover: mouseover(target),
      mouseout: mouseout(target),
      target: target,
      y_accessor: ['osArch_x86', 'osArch_x86-64'],
      legend: ['32-bit', '64-bit'],
      max_y: 1,
      full_width: true,
      markers: globalMarkers,
    });

    MG.data_graphic({
      title: "Flash",
      data: data,
      format: 'perc',
      animate_on_load: true,
      interpolate: global.interpolate,
      width: global.chart.width,
      height: 300,
      xax_count: global.chart.xax_count,
      right: global.chart.right,
      target: '#detail-flash',
      y_accessor: ['hasFlash_True'],
      legend: ['Has Flash'],
      max_y: 1,
      area: true,
      full_width: true,
      markers: globalMarkers,
    });
  }

  function nicify_cpu_core_str(str) {
    var bits = str.split('_');
    return bits[2] + ' cores (' + bits[3] + 'GHz)';
  }

  function draw_gpu_models() {
    var target = '#detail-gpu-model';

    var gpu_models = topX('gpuModel_', global.data[0]);
    var gpu_models_keys = [];
    var gpu_models_labels = [];
    gpu_models.forEach(function(d, i) {
      if(global.gpuModelNice[d.key] == undefined
          || global.gpuModelNice[d.key] == undefined
          || global.ignoredGpuVendors[global.gpuModelNice[d.key].vendor] == true
        ) {
        return;
      }

      if (d.key == 'gpuModel_Other' || d.key == 'gpuModel_Unknown')
        return;

      gpu_models_keys.push(d.key);
      gpu_models_labels.push(global.gpuModelNice[d.key].nice);
    });

    var chart_type = (gpu_models_keys.length == 0)
      ? 'missing-data'
      : 'line';

    var args = {
      title: "GPU Model",
      data: [global.data],
      chart_type: chart_type,
      missing_text: 'No data, choose a vendor on the right.',
      format: 'perc',
      animate_on_load: true,
      interpolate: global.interpolate,
      width: global.chart.width,
      height: global.chart.height + 100,
      xax_count: global.chart.xax_count,
      yax_count: 10,
      right: global.chart.right,
      target: target,
      full_width: true,
      mouseover: mouseover(target),
      mouseout: mouseout(target),
      y_accessor: gpu_models_keys,
      legend: gpu_models_labels,
      markers: globalMarkers,
    };

    MG.data_graphic(args);

    //color lines based on vendor
    var r = /\d+/;
    d3Select(target).selectAll('.mg-line-legend text')
      .each(function() {
        var line_id_to_set;
        var vendor;

        //get text
        if (d3Select(this).node().innerHTML.indexOf('*') !== -1) {
          vendor = 'vendor-nvidia';
        } else if (d3Select(this).node().innerHTML.indexOf('†') !== -1) {
          vendor = 'vendor-amd';
        } else {
          vendor = 'vendor-intel';
        }

        //original line ID
        var line_id = d3Select(this).node().classList[1].match(r);

        //remove any old vendor ids
        d3Select(this)
          .classed('vendor-intel', false)
          .classed('vendor-amd', false)
          .classed('vendor-nvidia', false)

        //set vendor for legend labels
        d3Select(this)
          .classed(vendor, true)

        //cascade change to associated line and circle too
        d3Select(target).selectAll('path.mg-line' + line_id + '-color')
          .classed('vendor-intel-line', false)
          .classed('vendor-amd-line', false)
          .classed('vendor-nvidia-line', false)
          .classed(vendor + '-line', true);

        d3Select(target).selectAll('circle.mg-line' + line_id + '-color')
          .classed('vendor-intel', false)
          .classed('vendor-amd', false)
          .classed('vendor-nvidia', false)
          .classed('vendor-intel-line', false)
          .classed('vendor-amd-line', false)
          .classed('vendor-nvidia-line', false)
          .classed(vendor, true)
          .classed(vendor + '-line', true);
      });
  }

  d3SelectAll('.save-as-png').on("click", function() {
     d3Event.preventDefault();
     var id = d3Select(this).attr('data-chart');

     // generate style definitions on the svg element, do it now to avoid adding potentially unnecessary dom elements to all charts on page load
     generateStyleDefs(d3Select('#' + id).select('svg').node());

     var chart = d3Select('#' + id).select('svg');
        var html = chart
          .attr("version", 1.1)
          .attr("xmlns", "http://www.w3.org/2000/svg")
          .node().parentNode.innerHTML;

        var width = chart.attr("width")
        var height = chart.attr("height")

        var imgsrc = 'data:image/svg+xml;base64,'+ btoa(unescape(encodeURIComponent(html)));
        saveSvg(imgsrc, width, height, id, 'black');
        saveSvg(imgsrc, width, height, id);
  });

  d3Select('.intel-toggle')
    .on('click', function() {
      d3Event.preventDefault();
      toggleGpuVendor('Intel', d3Select(this));

      return false;
    });

  d3Select('.nvidia-toggle')
    .on('click', function() {
      d3Event.preventDefault();
      toggleGpuVendor('NVIDIA', d3Select(this));

      return false;
    });

  d3Select('.amd-toggle')
    .on('click', function() {
      d3Event.preventDefault();
      toggleGpuVendor('AMD', d3Select(this));

      return false;
    });

  function toggleGpuVendor(vendor, e) {
      if(e.classed('showing')) {
        global.ignoredGpuVendors[vendor] = true;
        draw_gpu_models();

        e.classed('showing', false)
          .classed('hiding', true)
          .classed('active', false);
      } else {
        global.ignoredGpuVendors[vendor] = false;
        draw_gpu_models();

        e.classed('hiding', false)
          .classed('showing', true)
          .classed('active', true);
      }
  }

  function shakeButton(buttonElm) {
    $(buttonElm)
      .effect('shake', {
        distance: 3,
        times: 2
      }, 500);
  }

  function navigateHero(direction, associatedButton) {
    var currentHeroIndex = global.heroIndex;
    var nextHeroIndex;

    switch(direction) {
      case 'first':
        nextHeroIndex = global.data.length - 1;
        break;
      case 'backward':
        var currentPlusOne = currentHeroIndex + 1;
        nextHeroIndex = currentPlusOne < global.data.length ? currentPlusOne : global.data.length - 1;
        break;
      case 'forward':
        var currentMinusOne = currentHeroIndex - 1;
        nextHeroIndex = currentMinusOne >= 0 ? currentMinusOne : 0;
        break;
      case 'last':
        nextHeroIndex = 0;
        break;
      default:
        nextHeroIndex = currentHeroIndex;
        break;
    }

    if (nextHeroIndex === currentHeroIndex) {
      shakeButton(associatedButton);
    }

    global.heroIndex = nextHeroIndex;
    drawHeroCharts(global.data[global.heroIndex]);
  }

  document.getElementById('hero-first').addEventListener('click', function(e) {
    e.preventDefault();
    navigateHero('first', this);
  });

  document.getElementById('hero-backward').addEventListener('click', function(e) {
    e.preventDefault();
    navigateHero('backward', this);
  });

  document.getElementById('hero-forward').addEventListener('click', function(e) {
    e.preventDefault();
    navigateHero('forward', this);
  });

  document.getElementById('hero-last').addEventListener('click', function(e) {
    e.preventDefault();
    navigateHero('last', this);
  });

  window.onresize = function(event) {
    d3SelectAll('.hero svg')
      .attr('width', function() {
        var width = d3Select(this).node().parentElement.clientWidth;
        return (width > 450) ? 450 : width;
      });
  };

// todo credit, forgot which kindred spirit i adapted this from
function generateStyleDefs(svgDomElement) {
  var styleDefs = "";
  var sheets = document.styleSheets;
  for (var i = 0; i < sheets.length; i++) {
    try {
      sheets[i].cssRules;
    } catch(e) {
      console.log('skipping', sheets[i]);
      continue;
    }

    var rules = sheets[i].cssRules;

    if(rules == null) rules = [];
    for (var j = 0; j < rules.length; j++) {
      var rule = rules[j];
      if (rule.style) {
        var selectorText = rule.selectorText;

        if(selectorText && selectorText[0] == '#') {
          var bits = selectorText.split(' ');
          if(bits.length > 1) {
            bits.forEach(function(d, i) {
              //if we're targeting this chart in the selector, strip qualifier
              if(d == '#' + svgDomElement.parentNode.id) {
                selectorText = bits[i + 1];
              }
            });
          }
        }

        //does this selector apply to this chart
        var elems = svgDomElement.querySelectorAll(selectorText);

        if (elems.length) {
          styleDefs += selectorText + " { " + rule.style.cssText + " }\n";
        }
      }
    }
  }

  var s = document.createElement('style');
  s.setAttribute('type', 'text/css');
  s.innerHTML = "<![CDATA[\n" + styleDefs + "\n]]>";
  //somehow cdata section doesn't always work; you could use this instead:
  //s.innerHTML = styleDefs;

  var defs = document.createElement('defs');
  defs.appendChild(s);
  svgDomElement.insertBefore(defs, svgDomElement.firstChild);
}

function saveSvg(imgsrc, width, height, id, background) {
  if (!id) {
    return false
  }

  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.backgroundColor = 'rgba(0, 0, 0, 1)';

  var context = canvas.getContext('2d');

  if(background) {
    context.rect(0, 0, width, height);
    context.fillStyle = 'black';
    context.fill();
  }

  var image = new Image;
  image.src = imgsrc;
  image.onload = function() {
    context.drawImage(image, 0, 0);
    var canvas_data = canvas.toDataURL('image/png');
    var png = '<img src="' + canvas_data + '">';
    d3Select('#pngdataurl').html(png);

    //var a = document.createElement('a');
    d3Select('body').append('a')
      .attr('download', id + '.png')
      .attr('href', canvas_data)
      .node()
      .click()
  };
}

});
