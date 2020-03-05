var left, right;



sigma.classes.graph.addMethod('neighbors', function (nodeId) {
    var k,
        neighbors = {},
        index = this.allNeighborsIndex[nodeId] || {};

    for (k in index)
        neighbors[k] = this.nodesIndex[k];

    return neighbors;
});

function refreshGraph(name, side) {

    sigma.parsers.json(name, {
        container: side + "_svg",
        render: {
            container: document.getElementById(side + "_svg"),
            type: 'canvas'
        },
        settings: {
            minNodeSize: 8,
            maxNodeSize: 16
        }
    
    },
        function (s) {
            console.log(s)

            s.graph.nodes().forEach(function (node, i, a) {
                node.x = Math.cos(Math.PI * 2 * i / a.length);
                node.y = Math.sin(Math.PI * 2 * i / a.length);
                node.color = '#264249';
                node.label = node.label ? node.label : 'Node' + node.id;
            });

            sigma.plugins.relativeSize(s, 2);
            s.graph.nodes().forEach(function (n) {
                n.originalColor = n.color;
                console.log(n);
            });
            s.graph.edges().forEach(function (e) {
                e.originalColor = e.color;
            });
            s.bind('clickNode', function (e) {
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
                    console.log(n.originalColor);
                });

                s.graph.edges().forEach(function (e) {
                    e.color = e.originalColor;
                });

                // Same as in the previous event:
                s.refresh();
            });

            atlasObj = s.startForceAtlas2({
                linLogMode: true,
                outboundAttractionDistribution: true,
                adjustSizes: false,
                edgeWeightInfluence: 0,
                scalingRatio: 0.5,
                strongGravityMode: false,
                gravity: 2,
                barnesHutOptimize: false,
                barnesHutTheta: 0.5,
                slowDown: 1,
                startingIterations: 1,
                iterationsPerRender: 1,
                worker: true
            });
            window.setTimeout(function () { s.stopForceAtlas2(); }, 5000);
            var dragListener = sigma.plugins.dragNodes(s, s.renderers[0]);

            dragListener.bind('startdrag', function (event) {
                s.stopForceAtlas2();
            });
            dragListener.bind('drag', function (event) {
                console.log(event);
            });
            dragListener.bind('drop', function (event) {
                console.log(event);
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
                s.startForceAtlas2();
                window.setTimeout(function () { s.stopForceAtlas2(); }, 5000);
            });

        } 
    );
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
    if (side == "left") {
        window.left_id = sigma.instances(0) ? 1 : 0;
    } else {
        window.right_id = sigma.instances(0) ? 1 : 0;
    }

    refreshGraph(name, side);
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
        sigma.instances(window.left_id).kill();


    }

    fr.readAsText(files.item(0));

}

document.getElementById('right_import').onclick = function () {
    const files = document.getElementById('right_file').files;
    console.log(files);
    if (files.length <= 0) {
        return false;
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
        sigma.instances(window.right_id).kill();

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

//// CLEAR SVG //////

document.getElementById('left_clear').onclick = function () { //// d3 //////////////
    sigma.instances(window.left_id).kill();
}

document.getElementById('right_clear').onclick = function () { //// d3 ////////////
    sigma.instances(window.right_id).kill();
}

