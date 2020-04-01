var left, right;
var left_first_time = true;
var right_first_time = true;
var not_attributes = ['id', 'read_cam0:size', 'read_cam0:x', 'read_cam0:y', 'x', 'y', 'cam0:x', 'cam0:y', 'cam0:size', 'originalColor', 'label', 'size', 'source', 'target', 'size', 'subCommon_structure'];
left_clear_div = document.querySelector('#left_clear_div');
right_clear_div = document.querySelector('#right_clear_div');
var s_left = []
var s_right = []

var settings = {
    minNodeSize: 6,
    maxNodeSize: 8,
    defaultNodeColor: '#454545',
    edgeColor: 'default',
    defaultEdgeColor: '#aaa69d',
    minEdgeSize: 1,
    maxEdgeSize: 2,
    borderSize: 2,
    defaultNodeBorderColor: '#000',
    drawLabels: false,
    doubleClickEnabled: false
};

sigma.classes.graph.addMethod('neighbors', function (nodeId) {
    var k,
        neighbors = {},
        index = this.allNeighborsIndex[nodeId] || {};

    for (k in index)
        neighbors[k] = this.nodesIndex[k];

    return neighbors;
});



function refreshGraph(name, side, json, graph) {

    var atlas_settings = {
        linLogMode: true,
        outboundAttractionDistribution: false,
        adjustSizes: false,
        edgeWeightInfluence: 0,
        scalingRatio: 0.8,
        strongGravityMode: false,
        gravity: 3,
        barnesHutOptimize: false,
        barnesHutTheta: 0.8,
        slowDown: 5,
        startingIterations: 20,
        iterationsPerRender: 1,
        worker: true
    };


    if (json == "from_file") {
        sigma.parsers.json(name, {
            container: side + "_svg",
            render: {
                container: document.getElementById(side + "_svg"),
                type: 'canvas'
            },
            settings: settings

        },
            (s) => {

                var side = s.renderers[0].container.id == "left_svg" ? "left" : "right";

                ///// FOR NODE COLORING /////////////        

                var attributes = Object.keys(s.graph.nodes()[0]);
                attributes_to_label = [];
                for (let i = 0; i < attributes.length; i++) {
                    if (!not_attributes.includes(attributes[i])) {
                        attributes_to_label.push(attributes[i])
                    }
                }

                s.graph.nodes().forEach( (node, i, a) => {
                    node.x = Math.cos(Math.PI * 2 * i / a.length);
                    node.y = Math.sin(Math.PI * 2 * i / a.length);
                    node.label = node.label ? node.label : 'Node ' + node.id;
                    for (let i = 0; i < attributes_to_label.length; i++) {
                        node.label += " // " + eval("node." + attributes_to_label[i])
                    }
                });

                sigma.plugins.relativeSize(s, 2);
                s.graph.nodes().forEach( n => {
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

                $('<select id="recolor" onchange="if (this.selectedIndex) recolor(this.selectedIndex);" style="order:1">').appendTo('#color_selection');


                var value = 1;
                for (let i = 0; i < unique.length; i++) {
                    if (unique[i] == "Default") {
                        $('#recolor').append(new Option(unique[i], 0));
                    } else {
                        $('#recolor').append(new Option(unique[i], value));
                        value++;
                    }
                }

                ///// FOR EDGE VISUALIZATION /////////


                s.graph.edges().forEach( e => {
                    e.originalColor = e.color;
                });

                var edge_attributes = Object.keys(s.graph.edges()[0]);
                console.log(s.graph.edges()[0])
                attributes_to_edges = [];
                for (let i = 0; i < edge_attributes.length; i++) {
                    if (!not_attributes.includes(edge_attributes[i])) {
                        attributes_to_edges.push(edge_attributes[i])
                    }
                }

                var value = 1;
                for (let i = 0; i < edge_attributes.length; i++) {
                    if (!not_attributes.includes(edge_attributes[i])) {
                        $('#set_weight').append(new Option(edge_attributes[i], value));
                        value++;
                    }
                }

                var all_options = [];
                $("#set_weight option").each(function () {
                    all_options.push($(this).text())
                });

                var unique = [...new Set(all_options)];
                
                $("#set_weight").remove();

                $('<select id="set_weight" onchange="if (this.selectedIndex) add_weight(this.selectedIndex);" style="order:1">').appendTo('#edges_settings');

                var value = 1;
                for (let i = 0; i < unique.length; i++) {
                    if (unique[i] == "Default") {
                        $('#set_weight').append(new Option(unique[i], 0));
                    } else {
                        $('#set_weight').append(new Option(unique[i], value));
                        value++;
                    }
                }


                ////////// NEIGHBORS AND INFOBOXES ON DOUBLE CLICK /////////////////
                s.bind('doubleClickNode', e => {

                    // INFOBOXES
                    var container = e.data.renderer.container.id;
                    var container_id = "#" + container;
                    var info_box_id = container_id + '_node_info';
                    console.log(e);
                    console.log(attributes_to_label);
                    if ($(info_box_id).length === 0) {
                        $("<div id='" + container + "_node_info' class='info_box' title='click to remove'>").appendTo(container_id);
                        $("<p>Selected node id: " + e.data.node.id + "</p>").appendTo(info_box_id);
                        for (let i = 0; i < attributes_to_label.length; i++) {
                            $('<p>' + attributes_to_label[i] + ": " + eval('e.data.node.' + attributes_to_label[i]) + '</p>').appendTo(info_box_id);
                        }
                        $(info_box_id).on('click', function () {
                            $(this).remove();
                        });
                    }
                    else {
                        $(info_box_id + ' p').remove();
                        $("<p>Selected node id: " + e.data.node.id + "</p>").appendTo(info_box_id);
                        for (let i = 0; i < attributes_to_label.length; i++) {
                            $('<p>' + attributes_to_label[i] + ": " + eval('e.data.node.' + attributes_to_label[i]) + '</p>').appendTo(info_box_id);
                        }
                    }

                    ////// NEIGHBORS ///////

                    if (container == "left_svg") {
                        s = sigma.instances(window.left_id);
                        $("#right_svg_node_info").remove();
                        another_net = sigma.instances(window.right_id);
                    } else if (container == "right_svg") {
                        s = sigma.instances(window.right_id);
                        $("#left_svg_node_info").remove();
                        another_net = sigma.instances(window.left_id);
                    }
                    var nodeId = e.data.node.id,
                        toKeep = s.graph.neighbors(nodeId);
                    toKeep[nodeId] = e.data.node;
        
                    s.graph.nodes().forEach( n => {
                        if (toKeep[n.id]) {
                            n.color = n.id == nodeId ? '#ff5252' : n.originalColor;
                        }
                        else {
                            n.color = '#eee';
                        }
                    });

                    another_net.graph.nodes().forEach(n => {
                        if (toKeep[n.id]) {
                            n.color = n.id == nodeId ? '#ff5252' : n.originalColor;
                        }
                        else {
                            n.color = '#eee';
                        }
                    });
    
                    s.graph.edges().forEach( e => {
                        if (toKeep[e.source] && toKeep[e.target]) {
                            e.color = e.originalColor;
                        }
                        else {
                            e.color = '#eee';
                        }
                    });

                    another_net.graph.edges().forEach(e => {
                        if (toKeep[e.source] && toKeep[e.target]) {
                            e.color = e.originalColor;
                        }
                        else {
                            e.color = '#eee';
                        }
                    });
    
                    s.refresh();
                    another_net.refresh();
                });
                
                s.bind('clickStage', e => {
                    var container = e.data.renderer.container.id
                    if (container == "left_svg") {
                        s = sigma.instances(window.left_id);
                    } else if (container == "right_svg") {
                        s = sigma.instances(window.right_id);
                    }
                    s.graph.nodes().forEach( n => {
                        n.color = n.originalColor;
                    });
    
                    s.graph.edges().forEach( e => {
                        e.color = e.originalColor;
                    });
    
                    // Same as in the previous event:
                    s.refresh();
                });

                /////////// STATISTICS ///////

                var n1 = s.graph.nodes().length;
                var e1 = s.graph.edges().length;
                var d1 = e1 * 2 / (n1 * (n1 - 1));
                $('#' + side + '_node_count').text(n1);
                $('#' + side + '_edge_count').text(e1);
                $('#' + side + '_density').text((d1).toFixed(3));
                

                ////////// LAYOUT ///////////

                var noverlapListener = s.configNoverlap({
                    nodeMargin: 0.1,
                    scaleNodes: 1.05,
                    gridSize: 75,
                    easing: 'quadraticInOut', // animation transition function
                    duration: 10000   // animation duration. Long here for the purposes of this example only
                });
                // Bind the events:
                noverlapListener.bind('start stop interpolate', function (e) {
                    if (e.type === 'start') {
                        console.time('noverlap');
                    }
                    if (e.type === 'interpolate') {
                        console.timeEnd('noverlap');
                    }
                });

                //atlas_settings.gravity = s.graph.nodes().length > 100 ? 3 : 4;
                //atlas_settings.barnesHutOptimize = s.graph.nodes().length > 200 ? true : false;

                atlasObj = s.startForceAtlas2(atlas_settings);
                window.setTimeout( () => { s.stopForceAtlas2(); }, 5000);
                var dragListener = sigma.plugins.dragNodes(s, s.renderers[0]);

                dragListener.bind('startdrag', event => {
                    s.stopForceAtlas2();
                });
                dragListener.bind('dragend', event => {
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
        if (side == "left") {
            s_left = s;
        } else if (side == "right") {
            s_right = s;
        }



        ///// FOR NODE COLORING /////////////

        var attributes = Object.keys(eval("s_" + side).graph.nodes()[0]);
        attributes_to_label = [];
        for (let i = 0; i < attributes.length; i++) {
            if (!not_attributes.includes(attributes[i])) {
                attributes_to_label.push(attributes[i])
            }
        }

        eval("s_" + side).graph.nodes().forEach( (node, i, a) => {
            node.x = Math.cos(Math.PI * 2 * i / a.length);
            node.y = Math.sin(Math.PI * 2 * i / a.length);
            node.label = node.label ? node.label : 'Node ' + node.id;
            for (let i = 0; i < attributes_to_label.length; i++) {
                node.label += " // " + eval("node." + attributes_to_label[i])
            }
        });

        sigma.plugins.relativeSize(s, 2);
        eval("s_" + side).graph.nodes().forEach( n => {
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

        $('<select id="recolor" onchange="if (this.selectedIndex) recolor(this.selectedIndex);" style="order:1">').appendTo('#color_selection');


        var value = 1;
        for (let i = 0; i < unique.length; i++) {
            if (unique[i] == "Default") {
                $('#recolor').append(new Option(unique[i], 0));
            } else {
                $('#recolor').append(new Option(unique[i], value));
                value++;
            }
        }

        ///// FOR EDGE VISUALIZATION /////////
        eval("s_" + side).graph.edges().forEach( e => {
            e.originalColor = e.color;
        });

        var edge_attributes = Object.keys(eval("s_" + side).graph.edges()[0]);
        console.log(s.graph.edges()[0])
        attributes_to_edges = [];
        for (let i = 0; i < edge_attributes.length; i++) {
            if (!not_attributes.includes(edge_attributes[i])) {
                attributes_to_edges.push(edge_attributes[i])
            }
        }

        var value = 1;
        for (let i = 0; i < edge_attributes.length; i++) {
            if (!not_attributes.includes(edge_attributes[i])) {
                $('#set_weight').append(new Option(edge_attributes[i], value));
                value++;
            }
        }

        var all_options = [];
        $("#set_weight option").each(function () {
            all_options.push($(this).text())
        });

        var unique = [...new Set(all_options)];

        $("#set_weight").remove();

        $('<select id="set_weight" onchange="if (this.selectedIndex) add_weight(this.selectedIndex);" style="order:1">').appendTo('#edges_settings');

        var value = 1;
        for (let i = 0; i < unique.length; i++) {
            if (unique[i] == "Default") {
                $('#set_weight').append(new Option(unique[i], 0));
            } else {
                $('#set_weight').append(new Option(unique[i], value));
                value++;
            }
        }

        ////////// NEIGHBORS AND INFOBOXES ON DOUBLE CLICK /////////////////
        eval("s_" + side).bind('doubleClickNode', e => {

            // INFOBOXES
            var container = e.data.renderer.container.id;
            var container_id = "#" + container;
            var info_box_id = container_id + '_node_info';
            console.log(e);
            console.log(attributes_to_label);
            if ($(info_box_id).length === 0) {
                $("<div id='" + container + "_node_info' class='info_box' title='click to remove'>").appendTo(container_id);
                $("<p>Selected node id: " + e.data.node.id + "</p>").appendTo(info_box_id);
                for (let i = 0; i < attributes_to_label.length; i++) {
                    $('<p>' + attributes_to_label[i] + ": " + eval('e.data.node.' + attributes_to_label[i]) + '</p>').appendTo(info_box_id);
                }
                $(info_box_id).on('click', function () {
                    $(this).remove();
                });
            }
            else {
                $(info_box_id + ' p').remove();
                $("<p>Selected node id: " + e.data.node.id + "</p>").appendTo(info_box_id);
                for (let i = 0; i < attributes_to_label.length; i++) {
                    $('<p>' + attributes_to_label[i] + ": " + eval('e.data.node.' + attributes_to_label[i]) + '</p>').appendTo(info_box_id);
                }
            }

            ////// NEIGHBORS ///////

            if (container == "left_svg") {
                s_left = sigma.instances(window.left_id);
                $("#right_svg_node_info").remove();
                another_net = sigma.instances(window.right_id);
            } else if (container == "right_svg") {
                s_right = sigma.instances(window.right_id);
                $("#left_svg_node_info").remove();
                another_net = sigma.instances(window.left_id);
            }
            var nodeId = e.data.node.id,
                toKeep = eval("s_" + side).graph.neighbors(nodeId);
            toKeep[nodeId] = e.data.node;
            console.log(toKeep);
            console.log(e.data.node);

            eval("s_" + side).graph.nodes().forEach(n => {
                if (toKeep[n.id]) {
                    n.color = n.id == nodeId ? '#ff5252' : n.originalColor;
                }
                else {
                    n.color = '#eee';
                }
            });

            another_net.graph.nodes().forEach(n => {
                if (toKeep[n.id]) {
                    n.color = n.id == nodeId ? '#ff5252' : n.originalColor;
                }
                else {
                    n.color = '#eee';
                }
            });

            eval("s_" + side).graph.edges().forEach(e => {
                if (toKeep[e.source] && toKeep[e.target]) {
                    e.color = e.originalColor;
                }
                else {
                    e.color = '#eee';
                }
            });

            another_net.graph.edges().forEach(e => {
                if (toKeep[e.source] && toKeep[e.target]) {
                    e.color = e.originalColor;
                }
                else {
                    e.color = '#eee';
                }
            });

            eval("s_" + side).refresh();
            another_net.refresh();
        });

        eval("s_" + side).bind('clickStage', e => {
            var container = e.data.renderer.container.id
            if (container == "left_svg") {
                s_left = sigma.instances(window.left_id);
            } else if (container == "right_svg") {
                s_right = sigma.instances(window.right_id);
            }
            eval("s_" + side).graph.nodes().forEach(n => {
                n.color = n.originalColor;
            });

            eval("s_" + side).graph.edges().forEach(e => {
                e.color = e.originalColor;
            });

            // Same as in the previous event:
            eval("s_" + side).refresh();
        });

        /////////// STATISTICS ///////

        var n1 = eval("s_" + side).graph.nodes().length;
        var e1 = eval("s_" + side).graph.edges().length;
        var d1 = e1 * 2 / (n1 * (n1 - 1));
        $('#' + side + '_node_count').text(n1);
        $('#' + side + '_edge_count').text(e1);
        $('#' + side + '_density').text((d1).toFixed(3));

        ////////// LAYOUT ///////////

        var noverlapListener = eval("s_" + side).configNoverlap({
            nodeMargin: 0.1,
            scaleNodes: 1.25,
            gridSize: 75,
            permittedExpansion: 1.1,
            easing: 'quadraticInOut', // animation transition function
            duration: 10000   // animation duration. Long here for the purposes of this example only
        });
        // Bind the events:
        noverlapListener.bind('start stop interpolate', function (e) {
            if (e.type === 'start') {
                console.time('noverlap');
            }
            if (e.type === 'interpolate') {
                console.timeEnd('noverlap');
            }
        });

        //atlas_settings.gravity = eval("s_" + side).graph.nodes().length > 100 ? 6 : 3;
        //atlas_settings.barnesHutOptimize = eval("s_" + side).graph.nodes().length > 200 ? true : false;

        atlasObj = eval("s_" + side).startForceAtlas2(atlas_settings);
        window.setTimeout(() => { eval("s_" + side).stopForceAtlas2(); }, 5000);
        var dragListener = sigma.plugins.dragNodes(eval("s_" + side), eval("s_" + side).renderers[0]);

        dragListener.bind('startdrag', event => {
            eval("s_" + side).stopForceAtlas2();
        });
        dragListener.bind('dragend', event => {
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
        var name = "data/during.json";
    } else if (sel == 3) {
        var name = "data/before_new.json";
    } else if (sel == 4) {
        var name = "data/during_new.json";
    } else {
        $("#" + side + "_clear").trigger("click");
        eval("window." + side + "_id") = 0;
    }

    console.log(window.left_id);
    if (side == 'left' && left_first_time) {
        left_clear_div.classList.remove('hide');
        left_first_time = false;
        console.log("left first time drawing");
    } else if (side == 'left' && typeof sigma.instances(window.left_id) !== 'undefined') {
        console.log(sigma.instances(window.left_id));
        sigma.instances(window.left_id).kill();
    }

    if (side == 'right' && right_first_time) {
        right_clear_div.classList.remove('hide');
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

left_upload = document.querySelector('#left_file');

left_upload.addEventListener('change', function (e) {
    left_clear_div.classList.remove('hide');
    e.preventDefault();

    const files = document.getElementById('left_file').files;
    console.log(files);
    if (files.length <= 0) {
        return false;
    } else {
        $("#left_filename").text(files[0].name);
    }

    var fr = new FileReader();

    fr.onload = async e => {
        console.log(e);
        const result = JSON.parse(e.target.result);
        console.log(result)
        var formatted = JSON.stringify(result, null, 2);
        //document.getElementById('left_result').value = formatted;
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
    // TODO: stats for lett

});

right_upload = document.getElementById('right_file');

right_upload.addEventListener('change', function (e) {
    right_clear_div.classList.remove('hide');
    e.preventDefault();

    const files = document.getElementById('right_file').files;
    console.log(files);
    if (files.length <= 0) {
        return false;
    } else {
        $("#right_filename").text(files[0].name);
    }

    var fr = new FileReader();

    fr.onload = async e => {
        console.log(e);
        const result = JSON.parse(e.target.result);
        console.log(result)
        var formatted = JSON.stringify(result, null, 2);
        //document.getElementById('left_result').value = formatted;
        const response = await fetch("/api", {
            method: "POST",
            body: formatted,
            headers: { "Content-Type": "application/json" }
        })
        const d = await response.json();
        console.log(d);

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
    // TODO: stats for right
    fr.readAsText(files.item(0));

});

/// UI events ///

var i = 0;
var dragging = false;
$('#dragbar').mousedown( e => {
    e.preventDefault();

    dragging = true;
    var main = $('#right_side');
    var ghostbar = $('<div>',
        {
            id: 'ghostbar',
            css: {
                height: main.outerHeight(),
                top: main.offset().top,
                left: main.offset().left
            }
        }).appendTo('body');

    $(document).mousemove( e => {
        ghostbar.css("left", e.pageX + 2);
    });

});

$(document).mouseup( e => {
    if (dragging) {
        var percentage = (e.pageX / window.innerWidth) * 100;
        var mainPercentage = 100 - percentage;

        $('#console').text("side:" + percentage + " main:" + mainPercentage);

        $('#left_side').css("width", percentage + "%");
        $('#right_side').css("width", mainPercentage + "%");
        $('#ghostbar').remove();
        $(document).unbind('mousemove');
        dragging = false;
    }
});

///////////// STATISTICS ///////////////////////////
/*
$("#statistics").click( () => {
    

    if (typeof sigma.instances(window.left_id) !== "undefined") {
        var n1 = sigma.instances(window.left_id).graph.nodes().length;
        var e1 = sigma.instances(window.left_id).graph.edges().length;
        var d1 = e1 * 2 / (n1 * (n1 - 1));
        $('#left_node_count').text("Nodes: " + n1);
        $('#left_edge_count').text("Edges: " + e1);
        $('#left_density').text("Density: " + (d1).toFixed(3));
        // $('#node_count').text("Nodes: " + n1.pad(5, '') + "  " + right_value);
    } 

    if (typeof sigma.instances(window.right_id) !== "undefined") {
        var n2 = sigma.instances(window.right_id).graph.nodes().length;
        var e2 = sigma.instances(window.right_id).graph.edges().length;
        var d2 = e2 * 2 / (n2 * (n2 - 1));
        $('#right_node_count').text("Nodes: " + n2);
        $('#right_edge_count').text("Edges: " + e2);
        $('#right_density').text("Density: " + (d2).toFixed(3));
        // $('#node_count').text("Nodes: " + left_value + "  " + n2.pad(5, ''));
    }

    if (typeof sigma.instances(window.left_id) !== "undefined" && typeof sigma.instances(window.right_id) !== "undefined") {
        var result = find_common_structure();
        $('#common_nodes').text("Common nodes: " + result[0].length);
        $('#common_edges').text("Common edges: " + result[1].length);
        $('#similarity_coef').text("Jaccard index: " + (result[1].length / ((e1 + e2) - result[1].length)).toFixed(3));

    } else if (typeof sigma.instances(window.left_id) == "undefined" && typeof sigma.instances(window.right_id) == "undefined") {
        alert("Visualize at least one network to see the statistics")
    }

}
)*/


//// CLEAR SVG //////

function refresh_edge_weight_selection() {
    var y = document.getElementById("set_weight")
    var len_options = y.options.length;
    if (len_options > 1) {
        $("#set_weight").remove();
        var sel = $('<select id="set_weight" onchange="if (this.selectedIndex) add_weight(this.selectedIndex);" style="order:1">').appendTo('#edges_settings');
        sel.append($('<option>').attr('value', 0).text('Default'));
    } 

}

function refresh_color_selection() {
    $('.color_label').remove();
    var y = document.getElementById("recolor")
    var len_options = y.options.length;
    if (len_options > 1) {
        $("#recolor").remove();
        var sel = $('<select id="recolor" onchange="if (this.selectedIndex) recolor(this.selectedIndex,' + side + ');" style="order:1">').appendTo('#color_selection');
        sel.append($("<option>").attr('value', 0).text('Default'));
    }
}

$('#left_clear').on("click", () => {
    $('#set_weight option[value="0"]').attr("selected", true);
    $('#left_select option[value="0"]').attr("selected", true);
    $('#left_svg_node_info').remove();

    if (typeof sigma.instances(window.left_id) !== "undefined") {
        left_clear_div.classList.add('hide');
        sigma.instances(window.left_id).kill();
        left_first_time = true;
        refresh_color_selection();
        refresh_edge_weight_selection();
        $('#left_node_count').text("");
        $('#left_edge_count').text("");
        $('#left_density').text("");
        var checkBox = document.getElementById("togBtn");
        if (checkBox.checked == true) {
            $("#togBtn").trigger("click");
        }
        var checkBox = document.getElementById("togBtn2");
        if (checkBox.checked == true) {
            $("#togBtn2").trigger("click");
        }
    } else {
        console.log("Nothing to clear");
    }
});

$('#right_clear').on('click', () => {
    $('#set_weight option[value="0"]').attr("selected", true);
    $('#right_select option[value="0"]').attr("selected", true);
    $('#right_svg_node_info').remove();
    if (typeof sigma.instances(window.right_id) !== 'undefined') {
        right_clear_div.classList.add('hide');
        sigma.instances(window.right_id).kill(); 
        right_first_time = true;
        refresh_color_selection();
        refresh_edge_weight_selection();
        $('#right_node_count').text("");
        $('#right_edge_count').text("");
        $('#right_density').text("");
        var checkBox = document.getElementById("togBtn");
        if (checkBox.checked == true) {
            $("#togBtn").trigger("click");
        }
        var checkBox = document.getElementById("togBtn2");
        if (checkBox.checked == true) {
            $("#togBtn2").trigger("click");
        }
    } else {
        alert("Nothing to clear")
        console.log("Not")
    }
});

//// RECOLOR THE NODES ////

function recolor(index) {
    $('.color_label').remove();

    var colors = ['#65587f', '#f18867', '#e85f99', '#50bda1', '#ffc03d', '#00aedb', '#a2b825', '#4deeea', '#74ee15', '#a200ff', '#52B788', '#d41243', '#f000ff', '#EE6352', '#306B34', '#56EEF4', '#8E4162', '#9BF3F0', '#251351', '#001eff', '#f47835', '#FF4B3E', '#900C3F', '#5438DC', '#B3001B'];
    var x = document.getElementById("recolor");
    var selection = x.options[index].text;

    var labels = [];
    var assigned_colors = [];
    if (typeof sigma.instances(0) !== "undefined" && typeof sigma.instances(1) !== "undefined" && index != 0) {
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
        sigma.instances(0).refresh();

        sigma.instances(1).graph.nodes().forEach(n => {
            var label = eval("n." + selection);
            var color = assigned_colors[labels.indexOf(label)];
            n.color = color;
            n.originalColor = color;
        });
        sigma.instances(1).refresh();

        $('#networks').append('<div class="legend" id="legend">')
        function handle_mousedown(e) {
            window.my_dragging = {};
            my_dragging.pageX0 = e.pageX;
            my_dragging.pageY0 = e.pageY;
            my_dragging.elem = this;
            my_dragging.offset0 = $(this).offset();
            function handle_dragging(e) {
                var left = my_dragging.offset0.left + (e.pageX - my_dragging.pageX0);
                var top = my_dragging.offset0.top + (e.pageY - my_dragging.pageY0);
                $(my_dragging.elem)
                    .offset({ top: top, left: left });
            }
            function handle_mouseup(e) {
                $('body')
                    .off('mousemove', handle_dragging)
                    .off('mouseup', handle_mouseup);
            }
            $('body')
                .on('mouseup', handle_mouseup)
                .on('mousemove', handle_dragging);
        }
        $('#legend').mousedown(handle_mousedown);
        for (let i = 0; i < labels.length; i++) {
            $('#legend').append('<div class="color_label"' + ' style="background-color:' + assigned_colors[i] + ';margin:4px;order:' + (i + 2) + '" id="' + labels[i] + '">' + labels[i] + '</div>')
        }
    } else if (index == 0) {
        $('#legend').remove();

        // nodes
        sigma.instances(0).graph.nodes().forEach(n => {
            n.color = settings.defaultNodeColor;
            n.originalColor = n.color;
        })
        sigma.instances(1).graph.nodes().forEach(n => {
            n.color = settings.defaultNodeColor;
            n.originalColor = n.color;
        })

        sigma.instances(0).refresh();
        sigma.instances(1).refresh();
    } else {
        alert("both networks should be visualized");
        $("#recolor option[value='0']").attr("selected", true);

    }

}


///////////// ADD WEIGHT TO THE EDGES ///////////////////

function add_weight(index) {

    if (typeof sigma.instances(0) !== "undefined" && typeof sigma.instances(1) !== "undefined") {
        var x = document.getElementById("set_weight");
        var selection = x.options[index].text;

        sigma.instances(0).graph.edges().forEach(e => {
            var weight = eval("e." + selection);
            //e.size = weight;
            e.color = e.originalColor;
            e.color = weight > 0 ? "#7EB6FF" : e.color;
        })
        sigma.instances(0).refresh();

        sigma.instances(1).graph.edges().forEach(e => {
            var weight = eval("e." + selection);
            //e.size = weight;
            e.color = e.originalColor;
            e.color = weight > 0 ? "#7EB6FF" : e.color;
        })
        sigma.instances(1).refresh();

    } else {
        alert("both networks should be visualized");
        $("#set_weight option[value='0']").attr("selected", true);
    }
    
}
    

//////////// COMMON STRUCTURE HIGHLIGHT AND RESET ////////////////
$("#togBtn").on("click", () => {
    var checkBox = document.getElementById("togBtn");
    // If the checkbox is checked, display the output text
    if (checkBox.checked == true) {
        var left_sigma = sigma.instances(window.left_id);
        var right_sigma = sigma.instances(window.right_id);

        if (typeof left_sigma === 'undefined' || typeof right_sigma === 'undefined') {
            alert("Both networks should be visualized")
        } else {
            var result = find_common_structure();
            var nodes_intersection = result[0];
            var edges_intersection = result[1];
            var e1 = sigma.instances(window.left_id).graph.edges().length;
            var e2 = sigma.instances(window.right_id).graph.edges().length;

            console.log(nodes_intersection);

            left_sigma.graph.nodes().forEach(n => {
                n.originalColor = n.color;
                !nodes_intersection.includes(n.id) ? n.color = '#eee' : n.originalColor = n.originalColor;
            })
            right_sigma.graph.nodes().forEach(n => {
                n.originalColor = n.color;
                !nodes_intersection.includes(n.id) ? n.color = '#eee' : n.originalColor = n.originalColor;
            })

            console.log(edges_intersection);

            left_sigma.graph.edges().forEach(e => {
                if (!nodes_intersection.includes(e.source) || !nodes_intersection.includes(e.target) || !e.intersection == true) {
                    e.originalColor = e.color;
                    e.color = '#eee';
                } else {
                    e.originalColor = e.color;
                }
            });


            right_sigma.graph.edges().forEach(e => {
                if (!nodes_intersection.includes(e.source) || !nodes_intersection.includes(e.target) || !e.intersection == true) {
                    e.originalColor = e.color;
                    e.color = '#eee';
                } else {
                    e.originalColor = e.color;
                }
            });

            left_sigma.refresh();
            right_sigma.refresh();

            $('#common_nodes').text("Common nodes: " + result[0].length);
            $('#common_edges').text("Common edges: " + result[1].length);
            $('#similarity_coef').text("Jaccard index: " + (result[1].length / ((e1 + e2) - result[1].length)).toFixed(3));
        }
    } else {
        $('.info_box').remove();
        $('#common_nodes').text("Common nodes:");
        $('#common_edges').text("Common edges:");
        $('#similarity_coef').text("Jaccard index:");

        // nodes
        sigma.instances(0).graph.nodes().forEach(n => {
            n.color = n.originalColor;
        })
        sigma.instances(1).graph.nodes().forEach(n => {
            n.color = n.originalColor;
        })

        // edges
        sigma.instances(0).graph.edges().forEach(e => {
            //e.hidden = false;
            e.size = 0;
            e.color = e.originalColor;
        });


        sigma.instances(1).graph.edges().forEach(e => {
            //e.hidden = false;
            e.size = 0;
            e.color = e.originalColor;
        });

        sigma.instances(0).refresh();
        sigma.instances(1).refresh();
    }
})
    // Get the checkbox


function find_common_structure() {
    var left_sigma = sigma.instances(window.left_id);
    var right_sigma = sigma.instances(window.right_id);

    if (typeof left_sigma === 'undefined' || typeof right_sigma === 'undefined') {
        alert("Both networks should be visualized")
    } else {
        //// node intersection ////
        var left_nodes = [];
        left_sigma.graph.nodes().forEach( n => {
            left_nodes.push(n.id);
        })
        var right_nodes = [];
        right_sigma.graph.nodes().forEach( n => {
            right_nodes.push(n.id);
        })

        var left_edges = [];
        left_sigma.graph.edges().forEach( e => {
            left_edges.push([e.source, e.target]);
        })
        var right_edges = [];
        right_sigma.graph.edges().forEach( e => {
            right_edges.push([e.source, e.target]);
        })

        var nodes_intersection = left_nodes.filter( value => right_nodes.includes(value));

        //// edge intersection ////

        var edges_intersection = [];

        sigma.instances(window.right_id).graph.edges().forEach( e1 => {
            sigma.instances(window.left_id).graph.edges().forEach( e2 => {
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
        return [nodes_intersection, edges_intersection, left_nodes, right_nodes, left_edges, right_edges];
    }
}

////// ZOOM IN AND OUT //////

//// zoom in ///////////
$(document).ready( () => {
    $("#left_zoom_in").bind("click", () => {
        c = sigma.instances(window.left_id).camera;
        c.goTo({
            ratio: c.ratio / c.settings('zoomingRatio')
        });
    });
});

$(document).ready( () => {
    $("#right_zoom_in").bind("click", () => {
        c = sigma.instances(window.right_id).camera;
        c.goTo({
            ratio: c.ratio / c.settings('zoomingRatio')
        });
    });
});

//// zoom out /////////
$(document).ready( () => {
    $("#left_zoom_out").bind("click", () => {
        c = sigma.instances(window.left_id).camera;
        c.goTo({
            ratio: c.ratio * c.settings('zoomingRatio')
        });
    });
});

$(document).ready( () => {
    $("#right_zoom_out").bind("click", () => {
        c = sigma.instances(window.right_id).camera;
        c.goTo({
            ratio: c.ratio * c.settings('zoomingRatio')
        });
    });
});

///// reset ///////

$(document).ready( () => {
    $('#left_reset_zoom').bind("click", () => {
        c = sigma.instances(window.left_id).camera;
        c.goTo({
            ratio: 1,
            x: 0,
            y: 0,
            angle: 0
        })
    })
})

$(document).ready( () => {
    $('#right_reset_zoom').bind("click", () => {
        c = sigma.instances(window.right_id).camera;
        c.goTo({
            ratio: 1,
            x: 0,
            y: 0,
            angle: 0
        })
    })
})

//// for template /////

// arbitrary js object:
var myJsObj = {
    "_comment": "The .json must have 'nodes':[] and 'edges':[] parts. Each node and each edge should have a unique 'id'. Nodes and edges may include any number of attributes",
    "nodes": [
        {
            "sector_code": "Households",
            "postal_code": "Eastern-Finland",
            "age": "Retired",
            "id": "0"
        },
        {
            "sector_code": "Households",
            "postal_code": "Northern-Finland",
            "age": "Middle-Age",
            "id": "1"
        },
        {
            "sector_code": "Households",
            "postal_code": "Northern-Finland",
            "age": "Mature",
            "id": "2"
        },
        {
            "sector_code": "Households",
            "postal_code": "Northern-Finland",
            "age": "Retired",
            "id": "3"
        }
    ],
    "edges": [
        {
            "source": "0",
            "target": "3",
            "id": "0",
            "neighbors": "0"
        },
        {
            "source": "3",
            "target": "2",
            "id": "1",
            "neighbors": "1"
        },
        {
            "source": "2",
            "target": "0",
            "id": "2",
            "neighbors": "0"
        },
        {
            "source": "1",
            "target": "2",
            "id": "3",
            "neighbors": "1"
        },
        {
            "source": "1",
            "target": "3",
            "id": "4",
            "neighbors": "1"
        }
    ]
};

// using JSON.stringify pretty print capability:
var str = JSON.stringify(myJsObj, undefined, 4);

// display pretty printed object in text area:
document.getElementById('content').value = str;


///// DOWNLOADING SVG ///////


// Retrieving the svg file as a string

$(document).ready(() => {
    $("#left_svg_download").bind("click", () => {
        sigma.instances(window.left_id).toSVG({
            labels: false,
            classes: false,
            data: true,
            download: true,
            filename: 'left_network.svg'
        });

    });
});

$(document).ready(() => {
    $("#right_svg_download").bind("click", () => {
        sigma.instances(window.right_id).toSVG({
            size: 500,
            labels: false,
            classes: false,
            data: true,
            download: true,
            filename: 'right_network.svg'
        });

    });
});


//////// FINDING MAXIMUM COMMON INDUCED GRAPH /////////

function MCIS() {
    var n0 = [];
    sigma.instances(0).graph.nodes().forEach( n => {
        n0.push(n.id)
    });
    var e0 = [];
    sigma.instances(0).graph.edges().forEach(e => {
        e0.push([e.source, e.target])
    });

    var n1 = [];
    sigma.instances(1).graph.nodes().forEach(n => {
        n1.push(n.id)
    });
    var e1 = [];
    sigma.instances(1).graph.edges().forEach(e => {
        e1.push([e.source, e.target])
    });

    var g0 = new jsnx.Graph();
    g0.addNodesFrom(n0);
    g0.addEdgesFrom(e0);
    console.log(g0);

    var g1 = new jsnx.Graph();
    g1.addNodesFrom(n1);
    g1.addEdgesFrom(e1);
    console.log(g1);

    var common_nodes = n0.filter(value => n1.includes(value));
    var all_possible = common_nodes.flatMap(
        (v, i) => common_nodes.slice(i + 1).map(w => [v, w])
    );

    selected_edges = [];
    for (let i = 0; i < all_possible.length; i++) {
        var b0 = g0.hasEdge(all_possible[i][0], all_possible[i][1]);
        var b1 = g1.hasEdge(all_possible[i][0], all_possible[i][1]);
        (b0 && b1) || (!b0 && !b1) ? selected_edges.push(all_possible[i]) : false; 
    }

    var G = new jsnx.Graph();
    G.addNodesFrom(common_nodes);
    G.addEdgesFrom(selected_edges);
    cliques = new jsnx.findCliques(G);
    cliques_list = [];
    lengths = [];
    for (let value of cliques) {
        cliques_list.push(value);
        lengths.push(value.length);
    }

    console.log(lengths);
    
    var maxclique = cliques_list[cliques_list.reduce((p, c, i, a) => a[p].length > c.length ? p : i, 0)];
    console.log(maxclique);
    

    sigma.instances(0).graph.nodes().forEach(n => {
        n.originalColor = n.color;
        n.color = maxclique.includes(n.id) ? n.color : "#eee";        
    });
    sigma.instances(1).graph.nodes().forEach(n => {
        n.originalColor = n.color;
        n.color = maxclique.includes(n.id) ? n.color : "#eee";
    });

    sigma.instances(0).graph.edges().forEach(e => {
        if (maxclique.includes(e.source) && maxclique.includes(e.target)) {
            e.originalColor = e.color;
        } else {
            e.originalColor = e.color;
            e.color = "#eee"
        }
    })

    sigma.instances(1).graph.edges().forEach(e => {
        if (maxclique.includes(e.source) && maxclique.includes(e.target)) {
            e.originalColor = e.color;
        } else {
            e.originalColor = e.color;
            e.color = "#eee"
        }
    })

    $('#MaxClique').text("MaxClique node IDs: " + maxclique.join(', '));

    sigma.instances(0).refresh();
    sigma.instances(1).refresh();

}

$("#togBtn2").on("click", () => {
    var checkBox = document.getElementById("togBtn2");
    // If the checkbox is checked, display the output text
    if (checkBox.checked == true) {
        var left_sigma = sigma.instances(window.left_id);
        var right_sigma = sigma.instances(window.right_id);

        if (typeof left_sigma === 'undefined' || typeof right_sigma === 'undefined') {
            alert("Both networks should be visualized")
        } else {
            MCIS()
        }
    } else {
        $('.info_box').remove();
        $('#MaxClique').text("MaxClique node IDs:");

        // nodes
        sigma.instances(0).graph.nodes().forEach(n => {
            n.color = n.originalColor;
        })
        sigma.instances(1).graph.nodes().forEach(n => {
            n.color = n.originalColor;
        })

        // edges
        sigma.instances(0).graph.edges().forEach(e => {
            //e.hidden = false;
            //e.size = 0;
            e.color = e.originalColor;
        });


        sigma.instances(1).graph.edges().forEach(e => {
            //e.hidden = false;
            //e.size = 0;
            e.color = e.originalColor;
        });

        sigma.instances(0).refresh();
        sigma.instances(1).refresh();
    }
})

// Start the nooverlap layout:
$('#noOverlap').on("click", () => {
    if (typeof sigma.instances(window.left_id) != 'undefined' && typeof sigma.instances(window.right_id) != 'undefined') {
        sigma.instances(window.left_id).startNoverlap();
        sigma.instances(window.right_id).startNoverlap();
    }
})


//// RESET COLORS //////////////

$(document).ready(() => {
    $("#reset_node_color").bind("click", () => {
        $("#legend").remove();
        $('#recolor option[value="0"]').attr("selected", true);

        sigma.instances(0).graph.nodes().forEach(n => {
            n.originalColor = settings.defaultNodeColor;
            n.color = settings.defaultNodeColor;
        });
        sigma.instances(1).graph.nodes().forEach(n => {
            n.originalColor = settings.defaultNodeColor;
            n.color = settings.defaultNodeColor;
        });

        sigma.instances(0).refresh();
        sigma.instances(1).refresh();
    });
});

$(document).ready(() => {
    $("#reset_edge_color").bind("click", () => {
        $('#set_weight option[value="0"]').attr("selected", true);

        sigma.instances(0).graph.edges().forEach(e => {
            e.color = settings.defaultEdgeColor;
            e.originalColor = settings.defaultEdgeColor;
        });
        sigma.instances(1).graph.edges().forEach(e => {
            e.color = settings.defaultEdgeColor;
            e.originalColor = settings.defaultEdgeColor;
        });

        sigma.instances(0).refresh();
        sigma.instances(1).refresh();
    });
});
