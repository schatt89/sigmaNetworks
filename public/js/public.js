var left, right;
var left_first_time = true;
var right_first_time = true;
var not_attributes = ['id', 'read_cam0:size', 'read_cam0:x', 'read_cam0:y', 'x', 'y', 'cam0:x', 'cam0:y', 'cam0:size', 'originalColor', 'label', 'size', 'source', 'target', 'size'];

var settings = {
    minNodeSize: 4,
    maxNodeSize: 12,
    defaultNodeColor: '#454545',
    edgeColor: 'default',
    defaultEdgeColor: '#000',
    minEdgeSize: 1,
    maxEdgeSize: 3,
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
                        $('#recolor').append(new Option(unique[i], -1));
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
                        $('#set_weight').append(new Option(unique[i], -1));
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
                        for (let i = 0; i < attributes_to_label.length; i++) {
                            $('<p>' + attributes_to_label[i] + ": " + eval('e.data.node.' + attributes_to_label[i]) + '</p>').appendTo(info_box_id);
                        }
                        $(info_box_id).on('click', function () {
                            $(this).remove();
                        });
                    }
                    else {
                        $(info_box_id + ' p').remove();
                        for (let i = 0; i < attributes_to_label.length; i++) {
                            $('<p>' + attributes_to_label[i] + ": " + eval('e.data.node.' + attributes_to_label[i]) + '</p>').appendTo(info_box_id);
                        }
                    }

                    ////// NEIGHBORS ///////

                    if (container == "left_svg") {
                        s = sigma.instances(window.left_id);
                        another_net = sigma.instances(window.right_id);
                    } else if (container == "right_svg") {
                        s = sigma.instances(window.right_id);
                        another_net = sigma.instances(window.left_id);
                    }
                    var nodeId = e.data.node.id,
                        toKeep = s.graph.neighbors(nodeId);
                    toKeep[nodeId] = e.data.node;
        
                    s.graph.nodes().forEach( n => {
                        if (toKeep[n.id]) {
                            n.color = n.id == nodeId ? '#FF0000' : n.originalColor;
                        }
                        else {
                            n.color = '#eee';
                        }
                    });

                    another_net.graph.nodes().forEach(n => {
                        if (toKeep[n.id]) {
                            n.color = n.id == nodeId ? '#FF0000' : n.originalColor;
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
                    s.graph.nodes().forEach( n => {
                        n.color = n.originalColor;
                    });
    
                    s.graph.edges().forEach( e => {
                        e.color = e.originalColor;
                    });
    
                    // Same as in the previous event:
                    s.refresh();
                });
                

                ////////// LAYOUT ///////////
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
                $('#recolor').append(new Option(unique[i], -1));
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
                $('#set_weight').append(new Option(unique[i], -1));
            } else {
                $('#set_weight').append(new Option(unique[i], value));
                value++;
            }
        }

        ////////// NEIGHBORS AND INFOBOXES ON DOUBLE CLICK /////////////////
        s.bind('doubleClickNode', e => {

            ////////// INFOBOXES ///////////
            var container = e.data.renderer.container.id;
            var container_id = "#" + container;
            var info_box_id = container_id + '_node_info';

            if ($(info_box_id).length === 0) {
                $("<div id='" + container + "_node_info' class='info_box' title='click to remove'>").appendTo(container_id);
                for (let i = 0; i < attributes_to_label.length; i++) {
                    $('<p>' + attributes_to_label[i] + ": " + eval('e.data.node.' + attributes_to_label[i]) + '</p>').appendTo(info_box_id);
                }
                $(info_box_id).on('click', function () {
                    $(this).remove();
                });
            }
            else {
                $(info_box_id + ' p').remove();
                for (let i = 0; i < attributes_to_label.length; i++) {
                    $('<p>' + attributes_to_label[i] + ": " + eval('e.data.node.' + attributes_to_label[i]) + '</p>').appendTo(info_box_id);
                }
            }

            ////// NEIGHBORS ///////

            if (container == "left_svg") {
                s = sigma.instances(window.left_id);
                another_net = sigma.instances(window.right_id);
            } else if (container == "right_svg") {
                s = sigma.instances(window.right_id);
                another_net = sigma.instances(window.left_id);
            }
            var nodeId = e.data.node.id,
                toKeep = s.graph.neighbors(nodeId);
            toKeep[nodeId] = e.data.node;
            console.log(toKeep);
            console.log(e.data.node);

            s.graph.nodes().forEach(n => {
                if (toKeep[n.id]) {
                    n.color = n.id == nodeId ? '#FF0000' : n.originalColor;
                }
                else {
                    n.color = '#eee';
                }
            });

            another_net.graph.nodes().forEach(n => {
                if (toKeep[n.id]) {
                    n.color = n.id == nodeId ? '#FF0000' : n.originalColor;
                }
                else {
                    n.color = '#eee';
                }
            });

            s.graph.edges().forEach(e => {
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
            s.graph.nodes().forEach(n => {
                n.color = n.originalColor;
            });

            s.graph.edges().forEach(e => {
                e.color = e.originalColor;
            });

            // Same as in the previous event:
            s.refresh();
        });

        ////////// LAYOUT ///////////

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
        var name = "data/data2.json"
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

$('#left_import').on('click', () => {
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

});

$('#right_import').on('click', () => {
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
        //document.getElementById('right_result').value = formatted;
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

});

/// UI events ///

var i = 0;
var dragging = false;
$('#dragbar').mousedown( e => {
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

    $(document).mousemove( e => {
        ghostbar.css("left", e.pageX + 2);
    });

});

$(document).mouseup( e => {
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

$("#statistics").click( () => {

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

    } else if (typeof sigma.instances(window.left_id) == "undefined" && typeof sigma.instances(window.right_id) == "undefined") {
        alert("Visualize at least one network to see the statistics")
    }

}
)


//// CLEAR SVG //////

function refresh_edge_weight_selection() {
    var y = document.getElementById("set_weight")
    var len_options = y.options.length;
    if (len_options > 1) {
        $("#set_weight").remove();
        var sel = $('<select id="set_weight" onchange="if (this.selectedIndex) add_weight(this.selectedIndex);" style="order:1">').appendTo('#edges_settings');
        sel.append($('<option>').attr('value', -1).text('Default'));
    } 

}

function refresh_color_selection() {
    $('.color_label').remove();
    var y = document.getElementById("recolor")
    var len_options = y.options.length;
    if (len_options > 1) {
        $("#recolor").remove();
        var sel = $('<select id="recolor" onchange="if (this.selectedIndex) recolor(this.selectedIndex,' + side + ');" style="order:1">').appendTo('#color_selection');
        sel.append($("<option>").attr('value', -1).text('Default'));
    }
}

$('#left_clear').on("click", () => {
    $('#set_weight option[value="-1"]').attr("selected", true);
    $('#left_select option[value="-1"]').attr("selected", true);
    if (typeof sigma.instances(window.left_id) !== "undefined") {
        sigma.instances(window.left_id).kill();
        left_first_time = true;
        refresh_color_selection();
        refresh_edge_weight_selection();
    } else {
        alert("Nothing to clear")
    }
});

$('#right_clear').on('click', () => {
    $('#set_weight option[value="-1"]').attr("selected", true);
    $('#right_select option[value="-1"]').attr("selected", true);
    if (typeof sigma.instances(window.right_id) !== 'undefined') {
        sigma.instances(window.right_id).kill(); 
        right_first_time = true;
        refresh_color_selection();
        refresh_edge_weight_selection();
    } else {
        alert("Nothing to clear")
    }
});

//// RECOLOR THE NODES ////

function recolor(index) {
    $('.color_label').remove();

    var colors = ['#d41243', '#a2b825', '#4deeea', '#306B34', '#ffc03d', '#00aedb', '#B3001B', '#74ee15', '#a200ff', '#52B788', '#f000ff', '#EE6352', '#56EEF4', '#8E4162', '#9BF3F0', '#251351', '#001eff', '#f47835', '#FF4B3E', '#900C3F', '#5438DC'];
    var x = document.getElementById("recolor");
    var selection = x.options[index].text;

    var labels = [];
    var assigned_colors = [];
    if (typeof sigma.instances(0) !== "undefined" && typeof sigma.instances(1) !== "undefined") {
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

    } else {
        alert("both networks should be visualized");
        $("#recolor option[value='-1']").attr("selected", true);

    }

}


///////////// ADD WEIGHT TO THE EDGES ///////////////////

function add_weight(index) {

    if (typeof sigma.instances(0) !== "undefined" && typeof sigma.instances(1) !== "undefined") {
        var x = document.getElementById("set_weight");
        var selection = x.options[index].text;

        sigma.instances(0).graph.edges().forEach(e => {
            var weight = eval("e." + selection);
            e.size = weight;
            //e.color = e.originalColor;
            //e.originalColor = e.color;
            //e.color = weight > 0 ? "#dc143c" : e.color;
        })
        sigma.instances(0).refresh();

        sigma.instances(1).graph.edges().forEach(e => {
            var weight = eval("e." + selection);
            e.size = weight;
            //e.color = e.originalColor;
            //e.originalColor = e.color;
            //e.color = weight > 0 ? "#dc143c" : e.color;
        })
        sigma.instances(1).refresh();

    } else {
        alert("both networks should be visualized");
        $("#set_weight option[value='-1']").attr("selected", true);
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
        left_sigma.graph.nodes().forEach( n => {
            left_nodes.push(n.id);
        })
        var right_nodes = [];
        right_sigma.graph.nodes().forEach( n => {
            right_nodes.push(n.id);
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
        return [nodes_intersection, edges_intersection];
    }
}


$('#common_structure').on("click", () => {
    var left_sigma = sigma.instances(window.left_id);
    var right_sigma = sigma.instances(window.right_id);

    if (typeof left_sigma === 'undefined' || typeof right_sigma === 'undefined') {
        alert("Both networks should be visualized")
    } else {
        var result = find_common_structure();
        var nodes_intersection = result[0];
        var edges_intersection = result[1];

        console.log(nodes_intersection);

        left_sigma.graph.nodes().forEach( n => {
            !nodes_intersection.includes(n.id) ? n.color = '#eee' : n.originalColor = n.originalColor;
            n.originalColor = n.color;
        })
        right_sigma.graph.nodes().forEach( n => {
            !nodes_intersection.includes(n.id) ? n.color = '#eee' : n.originalColor = n.originalColor;
            n.originalColor = n.color;
        })

        console.log(edges_intersection);

        left_sigma.graph.edges().forEach( e => {
            if (!nodes_intersection.includes(e.source) || !nodes_intersection.includes(e.target) || !e.intersection == true) {
                e.color = '#eee';
                e.originalColor = e.color;
                //e.hidden = true;
            }
        });


        right_sigma.graph.edges().forEach( e => {
            if (!nodes_intersection.includes(e.source) || !nodes_intersection.includes(e.target) || !e.intersection == true) {
                e.color = '#eee';
                e.originalColor = e.color;
                //e.hidden = true;
            }
        });

        left_sigma.refresh();
        right_sigma.refresh();

        var x = [];
        var y = [];
        var ids = [];
        right_sigma.graph.nodes().forEach( n => {
            if (nodes_intersection.includes(n.id)) {
                x.push(n.x);
                y.push(n.y);
                ids.push(n.id);
            }
        })
        right_sigma.graph.nodes().forEach( n => {
            if (nodes_intersection.includes(n.id)) {
                n.x = x[ids.indexOf(n.id)];
                n.y = y[ids.indexOf(n.id)];
            } else {
                n.x = 0;
                n.y = 0;
            }
        })


    }

});

////// RESET COMMON STRUCTURE //////
$('#reset_common_structure').on('click', () => {
    $('#set_weight option[value="-1"]').attr("selected", true);
    $('#recolor option[value="-1"]').attr("selected", true);
    $('#legend').remove();
    $('.info_box').remove();

    // nodes
    sigma.instances(0).graph.nodes().forEach( n => {
        n.color = settings.defaultNodeColor;
        n.originalColor = n.color;
    })
    sigma.instances(1).graph.nodes().forEach( n => {
        n.color = settings.defaultNodeColor;
        n.originalColor = n.color;
    })

    // edges
    sigma.instances(0).graph.edges().forEach( e => {
        //e.hidden = false;
        e.size = 0;
        e.color = settings.defaultEdgeColor;
        e.originalColor = e.color;
    });


    sigma.instances(1).graph.edges().forEach( e => {
        //e.hidden = false;
        e.size = 0;
        e.color = settings.defaultEdgeColor;
        e.originalColor = e.color;
    });

    sigma.instances(0).refresh();
    sigma.instances(1).refresh();
});


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