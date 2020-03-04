

// load the data

function network_from_selected_data(sel) {
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

    sigma.parsers.json(name,
        { container: window.side + '_svg',
          settings: {defaultNodeColor: '#ec5148'}
        },
        function (s) { //This function is passed an instance of Sigma s

            //Initialize nodes as a circle
            s.graph.nodes().forEach(function (node, i, a) {
                node.x = Math.cos(Math.PI * 2 * i / a.length);
                node.y = Math.sin(Math.PI * 2 * i / a.length);
                console.log(node.id, node.x, node.y);
            });

            //Call refresh to render the new graph
            s.startForceAtlas2({ worker: true, barnesHutOptimize: false, startingIterations: 6, iterationsPerRender: 0});
        });

}



function select_data(index, side) {

    var x = document.getElementById(side + "_select")
    window.side = side;
    var selection = x.options[index].index;
    network_from_selected_data(selection);
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
    var svg = d3.select("#left_svg");
    svg.selectAll("*").remove();
}

document.getElementById('right_clear').onclick = function () { //// d3 ////////////
    var svg = d3.select("#right_svg");
    svg.selectAll("*").remove();
}

