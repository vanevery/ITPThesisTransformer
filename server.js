// HTTP Portion
var http = require('http');
var fs = require('fs'); // Using the filesystem module
var httpServer = http.createServer(requestHandler);
var url = require('url');
httpServer.listen(8080);

function requestHandler(req, res) {

	var parsedUrl = url.parse(req.url);
	console.log("The Request is: " + parsedUrl.pathname);

	var path = parsedUrl.pathname;
	if (path == "/") {
		path = "/index.html";
	}
	
	// Read index.html
	fs.readFile(__dirname + path,
		// Callback function for reading
		function (err, data) {
			// if there is an error
			if (err) {
				res.writeHead(500);
				return res.end('Error loading ' + parsedUrl.pathname);
			}
			// Otherwise, send the data, the contents of the file
			res.writeHead(200);
			res.end(data);
  		}
  	);
  	
  	/*
  	res.writeHead(200);
  	res.end("Life is wonderful");
  	*/
}

// WebSocket Portion
// WebSockets work with the HTTP server
var io = require('socket.io').listen(httpServer);

var adminClient = null;
var broadcasterClients = [];
var viewerClients = [];

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection', 
	// We are given a websocket object in our function
	function (socket) {
	
		console.log("We have a new client: " + socket.id);

		socket.on('broadcaster',
			function (data) {
				broadcasterClients.push(socket);
			}
		);

		socket.on('viewer',
			function (data) {
				viewerClients.push(socket);
			}
		);

		socket.on('admin',
			function (data) {
				adminClient = socket;
			}
		);

		/* Just an example	
		// client side: socket.send("the message");  or socket.emit('message', "the message");
		socket.on('message', 
			// Run this function when a message is sent
			function (data) {
				console.log("message: " + data);
				
				// Call "broadcast" to send it to all clients (except sender), this is equal to
				// socket.broadcast.emit('message', data);
				socket.broadcast.send(data);
				
				// To all clients, on io.sockets instead
				// io.sockets.emit('message', "this goes to everyone");
			}
		);
		*/
	
		// When we get an image from a broadcaster	
		socket.on('image', function(data) {
			// Data comes in as whatever was sent, including objects
			//console.log("Received: 'image' " + data.rotationMatrix);
			socket.emit('gotimage');

			// Loop through the viewers, see if they are ready for it
			for (var i = 0; i < viewerClients.length; i++) {
				if (viewerClients[i] != null && viewerClients[i].sendnewimage) {
					viewerClients[i].sendnewimage = false;
					viewerClients[i].emit('image', data);
				}
			}
		});

		// Viewer client letting us know if they are ready for a new image
		socket.on('sendnewimage', function (data) {
			socket.sendnewimage = true;
		});
	
		// Keep our arrays tidy, clean up disconnects	
		socket.on('disconnect', function() {
			console.log("Client has disconnected");
			var indexToRemove = broadcasterClients.indexOf(socket);
			if (indexToRemove > -1) {
				var removedElements = broadcasterClients.splice(indexToRemove, 1);	
				console.log("Removed " + removedElements.length + " elements from broadcaster array");
			} else {
				indexToRemove = viewerClients.indexOf(socket);
				if (indexToRemove > -1) {
					var removedElements = viewerClients.splice(indexToRemove, 1);	
					console.log("Removed " + removedElements.length + " elements from viewer array");
				}
			}		
		});
	}
);


