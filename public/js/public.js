var left, right;
var left_first_time = true;
var right_first_time = true;


/*
sigma.classes.graph.addMethod('neighbors', function (nodeId) {
    var k,
        neighbors = {},
        index = this.allNeighborsIndex[nodeId] || {};

    for (k in index)
        neighbors[k] = this.nodesIndex[k];

    return neighbors;
});
*/


function refreshGraph(name, side, json, graph) {
    var settings = {
                minNodeSize: 4,
                maxNodeSize: 12,
                defaultNodeColor: '#264249',
                edgeColor: 'default',
                defaultEdgeColor: '#264249',
                borderSize: 2,
                defaultNodeBorderColor: '#000',
                drawLabels: false
            };

    var atlas_settings = {
        linLogMode: true,
        outboundAttractionDistribution: false,
        adjustSizes: false,
        edgeWeightInfluence: 0,
        scalingRatio: 0.7,
        strongGravityMode: false,
        gravity: 3,
        barnesHutOptimize: false,
        barnesHutTheta: 0.5,
        slowDown: 5,
        startingIterations: 20,
        iterationsPerRender: 1,
        worker: true
    };

    var not_attributes = ['id', 'read_cam0:size', 'read_cam0:x', 'read_cam0:y', 'x', 'y', 'cam0:x', 'cam0:y', 'cam0:size', 'originalColor', 'label', 'size'];

    if (json == "from_file") {
        sigma.parsers.json(name, {
            container: side + "_svg",
            render: {
                container: document.getElementById(side + "_svg"),
                type: 'canvas'
            },
            settings: settings

        },
            function (s) {

                var attributes = Object.keys(s.graph.nodes()[0]);
                attributes_to_label = [];
                for (let i = 0; i < attributes.length; i++) {
                    if (!not_attributes.includes(attributes[i])) {
                        attributes_to_label.push(attributes[i])
                    }
                }

                s.graph.nodes().forEach(function (node, i, a) {
                    node.x = Math.cos(Math.PI * 2 * i / a.length);
                    node.y = Math.sin(Math.PI * 2 * i / a.length);
                    node.label = node.label ? node.label : 'Node ' + node.id;
                    for (let i = 0; i < attributes_to_label.length; i++) {
                        node.label += " // " + eval("node." + attributes_to_label[i])
                    }
                });

                sigma.plugins.relativeSize(s, 2);
                s.graph.nodes().forEach(function (n) {
                    n.originalColor = n.color;
                    console.log(n);
                });

                var value = 1;
                for (let i = 0; i < attributes.length; i++) {
                    if (!not_attributes.includes(attributes[i])) {
                        $('#recolor').append(new Option(attributes[i], value));
                        value++;
                    }
                }

                var all_options = [];
                $("#recolor option").each(function () {
                    all_options.push($(this).text())
                });

                var unique = [...new Set(all_options)];

                $("#recolor").remove();

                $('<select id="recolor" onchange="if (this.selectedIndex) recolor(this.selectedIndex,' + side + ');">').appendTo('#color_selection');


                var value = 1;
                for (let i = 0; i < unique.length; i++) {
                    if (unique[i] == "Default") {
                        $('#recolor').append(new Option(unique[i], -1));
                    } else {
                        $('#recolor').append(new Option(unique[i], value));
                        value++;
                    }
                }

                s.graph.edges().forEach(function (e) {
                    e.originalColor = e.color;
                });
                /*
                s.bind('clickNode', function (e) {
                    console.log(e.data.node.color);
                    var nodeId = e.data.node.id,
                        toKeep = s.graph.neighbors(nodeId);
                    toKeep[nodeId] = e.data.node;
    
                    s.graph.nodes().forEach(function (n) {
                        if (toKeep[n.id]) {
                            n.color = n.originalColor;
                        }
                        else {
                            n.color = '#eee';
                        }
                    });
    
                    s.graph.edges().forEach(function (e) {
                        if (toKeep[e.source] && toKeep[e.target]) {
                            e.color = e.originalColor;
                        }
                        else {
                            e.color = '#eee';
                        }
                    });
    
                    s.refresh();
                });
                
                s.bind('clickStage', function (e) {
                    s.graph.nodes().forEach(function (n) {
                        n.color = n.originalColor;
                    });
    
                    s.graph.edges().forEach(function (e) {
                        e.color = e.originalColor;
                    });
    
                    // Same as in the previous event:
                    s.refresh();
                });
                */
                atlasObj = s.startForceAtlas2(atlas_settings);
                window.setTimeout(function () { s.stopForceAtlas2(); }, 5000);
                var dragListener = sigma.plugins.dragNodes(s, s.renderers[0]);

                dragListener.bind('startdrag', function (event) {
                    s.stopForceAtlas2();
                });
                dragListener.bind('dragend', function (event) {
                    nodes = atlasObj.supervisor.graph.nodes();
                    for (let j = 0, i = 0, l = atlasObj.supervisor.nodesByteArray.length; i < l; i += atlasObj.supervisor.ppn) {
                        if (nodes[j] === event.data.node) {
                            atlasObj.supervisor.nodesByteArray[i] = event.data.node.x;
                            atlasObj.supervisor.nodesByteArray[i + 1] = event.data.node.y;
                        }
                        j++;
                    }
                    /*s.startForceAtlas2();
                    window.setTimeout(function () { s.stopForceAtlas2(); }, 100);*/
                });

            }
        );

    } else if (json == "from_upload") {
        s = new sigma({
            graph: graph,
            container: side + "_svg",
            render: {
                container: document.getElementById(side + "_svg"),
                type: 'canvas'
            },
            settings: settings
        });

        var attributes = Object.keys(s.graph.nodes()[0]);
        attributes_to_label = [];
        for (let i = 0; i < attributes.length; i++) {
            if (!not_attributes.includes(attributes[i])) {
                attributes_to_label.push(attributes[i])
            }
        }

        s.graph.nodes().forEach(function (node, i, a) {
            node.x = Math.cos(Math.PI * 2 * i / a.length);
            node.y = Math.sin(Math.PI * 2 * i / a.length);
            node.label = node.label ? node.label : 'Node ' + node.id;
            for (let i = 0; i < attributes_to_label.length; i++) {
                node.label += " // " + eval("node." + attributes_to_label[i])
            }
        });

        sigma.plugins.relativeSize(s, 2);
        s.graph.nodes().forEach(function (n) {
            n.originalColor = n.color;
            console.log(n);
        });

        var value = 1;
        for (let i = 0; i < attributes.length; i++) {
            if (!not_attributes.includes(attributes[i])) {
                $('#recolor').append(new Option(attributes[i], value));
                value++;
            }
        }

        var all_options = [];
        $("#recolor option").each(function () {
            all_options.push($(this).text())
        });

        var unique = [...new Set(all_options)];

        $("#recolor").remove();

        var sel = $('<select id="recolor" onchange="if (this.selectedIndex) recolor(this.selectedIndex,' + side + ');">').appendTo('#color_selection');


        var value = 1;
        for (let i = 0; i < unique.length; i++) {
            if (unique[i] == "Default") {
                $('#recolor').append(new Option(unique[i], -1));
            } else {
                $('#recolor').append(new Option(unique[i], value));
                value++;
            }
        }

        s.graph.edges().forEach(function (e) {
            e.originalColor = e.color;
        });

        atlasObj = s.startForceAtlas2(atlas_settings);
        window.setTimeout(function () { s.stopForceAtlas2(); }, 5000);
        var dragListener = sigma.plugins.dragNodes(s, s.renderers[0]);

        dragListener.bind('startdrag', function (event) {
            s.stopForceAtlas2();
        });
        dragListener.bind('dragend', function (event) {
            nodes = atlasObj.supervisor.graph.nodes();
            for (let j = 0, i = 0, l = atlasObj.supervisor.nodesByteArray.length; i < l; i += atlasObj.supervisor.ppn) {
                if (nodes[j] === event.data.node) {
                    atlasObj.supervisor.nodesByteArray[i] = event.data.node.x;
                    atlasObj.supervisor.nodesByteArray[i + 1] = event.data.node.y;
                }
                j++;
            }
        });
    }
}


// load the data

function network_from_selected_data(sel, side) {
    if (sel == 1) {
        var name = "data/before.json";
    } else if (sel == 2) {
        var name = "data/during.json"
    } else if (sel == 3) {
        var name = "data/data.json"
    } else if (sel == 4) {
        var name = "śata/data2.json"
    } else if (sel == 5) {
        var name = "data/sigma-data.json"
    }

    console.log(window.left_id);
    if (side == 'left' && left_first_time) {
        left_first_time = false;
        console.log("left first time drawing");
    } else if (side == 'left' && typeof sigma.instances(window.left_id) !== 'undefined') {
        console.log(sigma.instances(window.left_id));
        sigma.instances(window.left_id).kill();
    }

    if (side == 'right' && right_first_time) {
        right_first_time = false;
        console.log("right first time drawing");
    } else if (side == 'right' && typeof sigma.instances(window.right_id) !== 'undefined') {
        sigma.instances(window.right_id).kill();
    }

    if (side == "left") {
        window.left_id = sigma.instances(0) ? 1 : 0;
    } else {
        window.right_id = sigma.instances(0) ? 1 : 0;
    }

    refreshGraph(name, side, json = "from_file", graph = "none");
}



function select_data(index, side) {

    var x = document.getElementById(side + "_select")
    window.side = side;
    var selection = x.options[index].index;

    network_from_selected_data(selection, side);
}


//////////// UPLOADING A CUSTOM FILE //////////////

document.getElementById('left_import').onclick = function () {
    const files = document.getElementById('left_file').files;
    console.log(files);
    if (files.length <= 0) {
        return false;
    } else {
        $("#left_filename").text(files[0].name);
    }

    var fr = new FileReader();

    fr.onload = async function (e) {
        console.log(e);
        const result = JSON.parse(e.target.result);
        console.log(result)
        var formatted = JSON.stringify(result, null, 2);
        document.getElementById('left_result').value = formatted;
        const response = await fetch("/api", {
            method: "POST",
            body: formatted,
            headers: { "Content-Type": "application/json" }
        })
        const d = await response.json();
        console.log(d);

        //// add building network with sigma here ////

        if (left_first_time) {
            left_first_time = false;
            console.log("left first time drawing");
        } else if (typeof sigma.instances(window.left_id) !== 'undefined') {
            sigma.instances(window.left_id).kill();
        }

        window.left_id = sigma.instances(0) ? 1 : 0;

        refreshGraph(name = "none", side = "left", json = "from_upload", graph = d.data);
    }

    fr.readAsText(files.item(0));

}

document.getElementById('right_import').onclick = function () {
    const files = document.getElementById('right_file').files;
    console.log(files);
    if (files.length <= 0) {
        return false;
    } else {
        $("#right_filename").text(files[0].name);
    }

    var fr = new FileReader();

    fr.onload = async function (e) {
        console.log(e);
        const result = JSON.parse(e.target.result);
        console.log(result)
        var formatted = JSON.stringify(result, null, 2);
        document.getElementById('right_result').value = formatted;
        const response = await fetch("/api", {
            method: "POST",
            body: formatted,
            headers: { "Content-Type": "application/json" }
        })
        const d = await response.json();

        //// add building network with sigma here ////

        if (right_first_time) {
            right_first_time = false;
            console.log("right first time drawing");
        } else if (typeof sigma.instances(window.right_id) !== 'undefined') {
            sigma.instances(window.right_id).kill();
        }

        window.right_id = sigma.instances(0) ? 1 : 0;

        refreshGraph(name = "none", side = "right", json = "from_upload", graph = d.data);

    }

    fr.readAsText(files.item(0));

}

/// UI events ///

var i = 0;
var dragging = false;
$('#dragbar').mousedown(function (e) {
    e.preventDefault();

    dragging = true;
    var main = $('#main');
    var ghostbar = $('<div>',
        {
            id: 'ghostbar',
            css: {
                height: main.outerHeight(),
                top: main.offset().top,
                left: main.offset().left
            }
        }).appendTo('body');

    $(document).mousemove(function (e) {
        ghostbar.css("left", e.pageX + 2);
    });

});

$(document).mouseup(function (e) {
    if (dragging) {
        var percentage = (e.pageX / window.innerWidth) * 100;
        var mainPercentage = 100 - percentage;

        $('#console').text("side:" + percentage + " main:" + mainPercentage);

        $('#sidebar').css("width", percentage + "%");
        $('#main').css("width", mainPercentage + "%");
        $('#ghostbar').remove();
        $(document).unbind('mousemove');
        dragging = false;
    }
});

///////////// STATISTICS ///////////////////////////

$("#statistics").click(function () {

    if (typeof sigma.instances(window.left_id) !== "undefined") {
        var n1 = sigma.instances(window.left_id).graph.nodes().length;
        var e1 = sigma.instances(window.left_id).graph.edges().length;
        var d1 = e1 * 2 / (n1 * (n1 - 1));
        $('#left_node_count').text("Nodes: " + n1);
        $('#left_edge_count').text("Edges: " + e1);
        $('#left_density').text("Density: " + (d1).toFixed(3));
    } 

    if (typeof sigma.instances(window.right_id) !== "undefined") {
        var n2 = sigma.instances(window.right_id).graph.nodes().length;
        var e2 = sigma.instances(window.right_id).graph.edges().length;
        var d2 = e2 * 2 / (n2 * (n2 - 1));
        $('#right_node_count').text("Nodes: " + n2);
        $('#right_edge_count').text("Edges: " + e2);
        $('#right_density').text("Density: " + (d2).toFixed(3));
    }
    if (typeof sigma.instances(window.left_id) !== "undefined" && typeof sigma.instances(window.right_id) !== "undefined") {
        var result = find_common_structure();
        $('#common_nodes').text("Common nodes: " + result[0].length);
        $('#common_edges').text("Common edges: " + result[1].length);
        $('#similarity_coef').text("Jaccard index: " + (result[1].length / ((e1 + e2) - result[1].length)).toFixed(3));

    }

}
)


//// CLEAR SVG //////

function refresh_color_selection() {
    $('.color_label').remove();
    var y = document.getElementById("recolor")
    var len_options = y.options.length;
    if (len_options > 1) {
        $("#recolor").remove();
        var arr = [{ val: -1, text: 'Default' }];

        var sel = $('<select id="recolor" onchange="if (this.selectedIndex) recolor(this.selectedIndex,' + side + ');">').appendTo('#color_selection');
        $(arr).each(function () {
            sel.append($("<option>").attr('value', this.val).text(this.text));
        });
    }
}

document.getElementById('left_clear').onclick = function () {
    sigma.instances(window.left_id).kill();
    left_first_time = true;

    refresh_color_selection();
}

document.getElementById('right_clear').onclick = function () {
    sigma.instances(window.right_id).kill();
    right_first_time = true;

    refresh_color_selection();

}

//// RECOLOR THE NODES ////

function recolor(index) {
    $('.color_label').remove();

    var colors = ['#d41243', '#a2b825', '#4deeea', '#306B34', '#ffc03d', '#00aedb', '#B3001B', '#74ee15', '#a200ff', '#5438DC', '#52B788', '#f000ff', '#EE6352', '#56EEF4', '#8E4162', '#9BF3F0', '#251351', '#001eff', '#f47835', '#FF4B3E'];
    var x = document.getElementById("recolor");
    var selection = x.options[index].text;

    var labels = [];
    var assigned_colors = [];
    sigma.instances(0).graph.nodes().forEach( n => {
        var label = eval("n." + selection);
        if (labels.includes(label)) {
            var color = colors[labels.indexOf(label)];
        } else {
            labels.push(label);
            var color = colors[labels.indexOf(label)];
            assigned_colors.push(color);
            console.log(label + ": " + color);
        }
        n.color = color;
        n.originalColor = color;
    });

    sigma.instances(0).startForceAtlas2();
    window.setTimeout(function () { sigma.instances(0).stopForceAtlas2(); }, 100);

    sigma.instances(1).graph.nodes().forEach( n => {
        var label = eval("n." + selection);
        var color = assigned_colors[labels.indexOf(label)];
        n.color = color;
        n.originalColor = color;
    })

    sigma.instances(1).startForceAtlas2();
    window.setTimeout(function () { sigma.instances(1).stopForceAtlas2(); }, 1);

    for (let i = 0; i < labels.length; i++) {
        $('#color_selection').append('<div class="color_label" style="background-color:' + assigned_colors[i] + ';margin:4px" id="' + labels[i] + '">' + labels[i] + '</div>')
    }



}

//////////// COMMON STRUCTURE HIGHLIGHT ////////////////

function find_common_structure() {
    var left_sigma = sigma.instances(window.left_id);
    var right_sigma = sigma.instances(window.right_id);

    if (typeof left_sigma === 'undefined' || typeof right_sigma === 'undefined') {
        alert("Both networks should be visualized")
    } else {
        //// node intersection ////
        var left_nodes = [];
        left_sigma.graph.nodes().forEach(n => {
            left_nodes.push(n.id);
        })
        var right_nodes = [];
        right_sigma.graph.nodes().forEach(n => {
            right_nodes.push(n.id);
        })

        var nodes_intersection = left_nodes.filter(value => right_nodes.includes(value));

        //// edge intersection ////

        var edges_intersection = [];

        sigma.instances(window.right_id).graph.edges().forEach(e1 => {
            sigma.instances(window.left_id).graph.edges().forEach(e2 => {
                if (e1.source == e2.source && e1.target == e2.target) {
                    edges_intersection.push([e1.source, e1.target]);
                    e1.intersection = true;
                    e2.intersection = true;
                } else if (e1.source == e2.target && e1.target == e2.source) {
                    edges_intersection.push([e1.target, e1.source]);
                    e1.intersection = true;
                    e2.intersection = true;
                }
            });
        });
        return [nodes_intersection, edges_intersection];
    }
}


document.getElementById('common_structure').onclick = function () {
    var left_sigma = sigma.instances(window.left_id);
    var right_sigma = sigma.instances(window.right_id);

    if (typeof left_sigma === 'undefined' || typeof right_sigma === 'undefined') {
        alert("Both networks should be visualized")
    } else {
        var result = find_common_structure();
        var nodes_intersection = result[0];
        var edges_intersection = result[1];

        console.log(nodes_intersection);

        sigma.instances(window.left_id).graph.nodes().forEach(n => {
            !nodes_intersection.includes(n.id) ? n.color = '#eee' : n.originalColor = n.originalColor;
        })
        sigma.instances(window.right_id).graph.nodes().forEach(n => {
            !nodes_intersection.includes(n.id) ? n.color = '#eee' : n.originalColor = n.originalColor;
        })

        console.log(edges_intersection);

        sigma.instances(window.left_id).graph.edges().forEach(e => {
            if (!nodes_intersection.includes(e.source) || !nodes_intersection.includes(e.target) || !e.intersection == true) {
                e.hidden = true;
                //sigma.instances(window.left_id).graph.dropEdge(e.id);
            }
        });


        sigma.instances(window.right_id).graph.edges().forEach(e => {
            if (!nodes_intersection.includes(e.source) || !nodes_intersection.includes(e.target) || !e.intersection == true) {
                e.hidden = true;
                //sigma.instances(window.right_id).graph.dropEdge(e.id);
            }
        });
        sigma.instances(window.left_id).startForceAtlas2();
        sigma.instances(window.right_id).startForceAtlas2();
        window.setTimeout(function () { sigma.instances(window.left_id).stopForceAtlas2(); }, 100);
        window.setTimeout(function () { sigma.instances(window.right_id).stopForceAtlas2(); }, 100);

        var x = [];
        var y = [];
        var ids = [];
        sigma.instances(window.right_id).graph.nodes().forEach( n => {
            if (nodes_intersection.includes(n.id)) {
                x.push(n.x);
                y.push(n.y);
                ids.push(n.id);
            }
        })
        sigma.instances(window.right_id).graph.nodes().forEach( n => {
            if (nodes_intersection.includes(n.id)) {
                n.x = x[ids.indexOf(n.id)];
                n.y = y[ids.indexOf(n.id)];
            } else {
                n.x = 0;
                n.y = 0;
            }
        })


    }

}

////// RESET COMMON STRUCTURE //////
document.getElementById('reset_common_structure').onclick = function () {
    sigma.instances(window.left_id).graph.nodes().forEach(n => {
        n.color = n.originalColor;
    })
    sigma.instances(window.right_id).graph.nodes().forEach(n => {
        n.color = n.originalColor;
    })

    sigma.instances(window.left_id).graph.edges().forEach(e => {
            e.hidden = false;
    });


    sigma.instances(window.right_id).graph.edges().forEach(e => {
            e.hidden = false;
    });

    sigma.instances(window.left_id).startForceAtlas2();
    sigma.instances(window.right_id).startForceAtlas2();
    window.setTimeout(function () { sigma.instances(window.left_id).stopForceAtlas2(); }, 100);
    window.setTimeout(function () { sigma.instances(window.right_id).stopForceAtlas2(); }, 100);
}