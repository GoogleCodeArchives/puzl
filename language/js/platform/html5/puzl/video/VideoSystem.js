CanvasIdCounter = -1;

RequestAnimFrame = window.requestAnimationFrame       ||
                   window.webkitRequestAnimationFrame ||
                   window.mozRequestAnimationFrame    ||
                   window.oRequestAnimationFrame      ||
                   window.msRequestAnimationFrame     ||
                   function( callback )
                   {
                     window.setTimeout( callback, 1000 / 60 );
                   };

var GlobalVideoSystem;

function VideoSystem( width, height )
{
  GlobalVideoSystem = this;
  
  this.videoImageIDList;
  this.videoImageLoadQueue;

  this.display;

  this.constructor( width, height );
}

VideoSystem.prototype.constructor = function( width, height )
{
  this.videoImageIDList    = new Array();
  this.videoImageLoadQueue = new Array();

  this.display = new VideoDisplay( width, height );
}

VideoSystem.prototype.getRequestAnimFrame = function( callback )
{
  return RequestAnimFrame( callback );
}

VideoSystem.prototype.update = function()
{
  this.display.drawUpdate();
}

VideoSystem.prototype.getDisplay = function()
{
  return this.display;
}

VideoSystem.prototype.getAvailableImageID = function()
{
  var numberOfIDSlots = this.videoImageIDList.length;
  var index;
  for( index = 0; index < numberOfIDSlots; index++ )
  {
    if( this.videoImageIDList[index] == null )
    {
      return index;
    }
  }

  return index;
}

VideoSystem.prototype.queueVideoImage = function( videoImage, filename )
{
  var availableImageID = this.getAvailableImageID();

  videoImage.videoSystem = this;
  videoImage.id = availableImageID;

  this.videoImageLoadQueue[this.videoImageLoadQueue.length] = videoImage;
  videoImage.image = new Image();

  videoImage.image.videoImageID = videoImage.id;
  //videoImage.image.addEventListener( "load", ProcessVideoImageLoad, false );
  videoImage.image.onload = ProcessVideoImageLoad;

  videoImage.filename = filename;
}

VideoSystem.prototype.processImageLoadQueue = function()
{
  var numberOfIDQueuedVideoImages = this.videoImageLoadQueue.length;
  var index;
  var videoImage;
  for( index = 0; index < numberOfIDQueuedVideoImages; index++ )
  {
    videoImage = this.videoImageLoadQueue[index];
    videoImage.image.src = videoImage.filename;
  }
}

function ProcessVideoImageLoad( loadEvent )
{
  var id = loadEvent.target.videoImageID;
  //var id = this.videoImageID;

  var numberOfIDQueuedVideoImages = GlobalVideoSystem.videoImageLoadQueue.length;
  var index;
  var videoImage;
  for( index = 0; index < numberOfIDQueuedVideoImages; index++ )
  {
    videoImage = GlobalVideoSystem.videoImageLoadQueue[index];
    if( id === videoImage.id )
    {
      if( ( videoImage.image.width === 0 ) && ( videoImage.image.height === 0 ) )
      {
        // Trash image and retry with a new one; something went wrong.
        // NOTE: This is a hack for webkit browsers running the load event before
        // the image object has valid data (width, height, etc).
        // TODO: Find a better solution?
        videoImage.image = null;
        videoImage.image = new Image();
        videoImage.image.videoImageID = id;
        videoImage.image.onload = ProcessVideoImageLoad;
        videoImage.image.src = videoImage.filename;
        return;
      }
      
      videoImage.setDimensions( videoImage.image.width, videoImage.image.height );
      //console.log( this.width );
      //console.log( this.height );
      videoImage.getContext().drawImage( videoImage.image, 0, 0 );
      
      GlobalVideoSystem.videoImageLoadQueue.splice( index, 1 );
      //videoImage.image.src = null; // NOTE: Should this be nulled here?

      //console.log( "ProcessVideoImageLoad(): Loaded " + videoImage.filename + "." );
      break;
    }
  }

  if( GlobalVideoSystem.videoImageLoadQueue.length === 0 )
  {
    // Attempt game post initialize.
    GlobalGameShell.shellPostInitialize();
  }
}

function SetCanvasXPosition( canvas, xPosition )
{
  canvas.style.left = xPosition + "px";
}

function SetCanvasYPosition( canvas, yPosition )
{
  canvas.style.top  = yPosition + "px";
}

function SetCanvasPosition( canvas, xPosition, yPosition )
{
  SetCanvasXPosition( canvas, xPosition );
  SetCanvasYPosition( canvas, yPosition );
}

function SetCanvasDimensions( canvas, width, height )
{
  canvas.width  = width;
  canvas.height = height;
}

function DrawWithNearestScale( image, context, xPosition, yPosition, width, height )
{
  // Create an offscreen canvas, draw an image to it, and fetch the pixels
  var offtx = document.createElement( "canvas" ).getContext( "2d" );
  offtx.drawImage( image, 0, 0 );

  var imgData;
  try
  {
    imgData = offtx.getImageData( 0, 0, image.width, image.height ).data;
  }
  catch( error )
  {
    // Just draw image the regular way.
    context.drawImage( image, xPosition, yPosition, width, height );
    return;
  }

  var zoomXLevel = width  / image.width;
  var zoomYLevel = height / image.height;

//   var zoomX
//
//   var i;
//   var r;
//   var g;
//   var b;
//   var a;


  // Draw the zoomed-up pixels to a different canvas context
  for( var x = 0; x < image.width; ++x )
  {
    for( var y = 0; y < image.height; ++y )
    {
      // Find the starting index in the one-dimensional image data
      var i = ( y * image.width + x ) * 4;
      var r = imgData[i    ];
      var g = imgData[i + 1];
      var b = imgData[i + 2];
      var a = imgData[i + 3];

      context.fillStyle = "rgba(" + r + "," + g + "," + b + "," + ( a / 255 ) + ")";
      context.fillRect( xPosition + ( x * zoomXLevel ), // TODO: Optimize.
                        yPosition + ( y * zoomYLevel ),
                        zoomXLevel, zoomYLevel );
    }
  }

  //document.destroyElement( "OffscreenCanvas" );
}

//var offscreenCanvas        = document.createElement( "canvas" );
//var offscreenCanvasContext = offscreenCanvas.getContext( "2d" );

function DrawWithNearestScale( sourceDrawObject, targetDrawObject, sourceXPosition, sourceYPosition, sourceWidth, sourceHeight, xPosition, yPosition, width, height )
{
  var image = sourceDrawObject.getCanvas();
  if( image === undefined )
  {
    image = sourceDrawObject;
  }
  
  var canvas = targetDrawObject.getCanvas();
  var context = GetCanvasContext2D( canvas );
  
  context.smoothingEnabled = false;
  context.mozImageSmoothingEnabled    = false;
  context.webkitImageSmoothingEnabled = false;
  context.drawImage( image, sourceXPosition, sourceYPosition, sourceWidth, sourceHeight, xPosition, yPosition, width, height );
  return;

  /*if( ( sourceHeight == height ) && ( sourceWidth == width ) )
  {
    // Just draw image the regular way.
    context.drawImage( image, sourceXPosition, sourceYPosition, sourceWidth, sourceHeight, xPosition, yPosition, width, height );
  }

  // Create an offscreen canvas, draw an image to it, and fetch the pixels
  offscreenCanvasContext.width  = sourceWidth;
  offscreenCanvasContext.height = sourceHeight;
  offscreenCanvasContext.clearRect( 0, 0, sourceWidth, sourceHeight );

  offscreenCanvasContext.drawImage( image, sourceXPosition, sourceYPosition, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight );

  var imgData;
  try
  {
    imgData = offscreenCanvasContext.getImageData( 0, 0, sourceWidth, sourceHeight ).data;
  }
  catch( error )
  {
    // Just draw image the regular way.
    context.drawImage( image, sourceXPosition, sourceYPosition, sourceWidth, sourceHeight, xPosition, yPosition, width, height );
    return;
  }

  var zoomXLevel = width  / sourceWidth;
  var zoomYLevel = height / sourceHeight;

  var zoomXIncrement = 0;
  var zoomYIncrement = 0;

  var i;
  var r;
  var g;
  var b;
  var a;

  // Draw the zoomed-up pixels to a different canvas context
  for( var x = 0; x < sourceWidth; ++x )
  {
    zoomXIncrement = x * zoomXLevel;

    for( var y = 0; y < sourceHeight; ++y )
    {
      zoomYIncrement = y * zoomYLevel;

      // Find the starting index in the one-dimensional image data
      i = ( y * sourceWidth + x ) << 2;
      r = imgData[i    ];
      g = imgData[i + 1];
      b = imgData[i + 2];
      a = imgData[i + 3];

      context.fillStyle = "rgba(" + r + "," + g + "," + b + "," + ( a / 255 ) + ")";
      context.fillRect( xPosition + ( zoomXIncrement ), // TODO: Optimize.
                        yPosition + ( zoomYIncrement ),
                        zoomXLevel, zoomYLevel );
    }
  }

  //document.destroyElement( "OffscreenCanvas" );*/
}

function BuildRgb( red, green, blue )
{
  return "rgb(" + red + "," + green + "," + blue + ")";
}

/*function BuildRgb( color )
{
  return "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
}*/

function BuildRgba( red, green, blue, alpha )
{
  return "rgba(" + red + "," + green + "," + blue + "," + ( alpha / 255 ) + ")";
}

function CreateOnScreenCanvas()
{
  var canvas;
  if( false )
  //if( ( navigator.isCocoonJS !== undefined ) && ( CanvasIdCounter === -1 ) )
  {
    // Utilize CocoonJS screencanvas for very first canvas created.
    console.log( "Creating a CocoonJS 'screencanvas'." );
    canvas = document.createElement( "screencanvas" );
    //canvas.screencanvas = "true";
  }
  else
  {
    canvas = document.createElement( "canvas" );
    
    // TODO: Append text node that says 'canvas is not supported'?
  }
  
  canvas.id = ++CanvasIdCounter + "canvas";
  
  canvas.style.position = "absolute";
  canvas.style.left     = 0;
  canvas.style.top      = 0
  canvas.style.zIndex   = 1;
    
  document.body.appendChild( canvas );

  return canvas;
}

function CreateOffScreenCanvas()
{
  var canvas = document.createElement( "canvas" );
  canvas.id = ++CanvasIdCounter + "canvas";

  return canvas;
}

function OffScreenToOnScreenCanvas( oldCanvas )
{
  //document.write( oldCanvas.outerHTML );
  var newCanvas = CreateOnScreenCanvas( oldCanvas.id );
  var context   = GetCanvasContext2D( newCanvas );
  context.drawImage( oldCanvas, 0, 0 );
  // NOTE: First draw sets the dimensions?

  return newCanvas;
}

function OnScreenToOffScreenCanvas( oldCanvas )
{
  // TODO: Needs more testing.
  oldCanvas = GetCanvas( oldCanvas.id );
  oldCanvas.parentNode.removeChild( oldCanvas );
  return oldCanvas;
}

function GetCanvas( id )
{
  var canvas = document.getElementById( id );
  if( !canvas || !canvas.getContext )
  {
    console.error( "Failed to get canvas element by id." );
    return;
  }

  return canvas;
}

GetCanvasContext2D =
(
  function()
  {
    if( navigator.isCocoonJS )
    {
      console.log( "Switching on CocoonJS GetCanvasContext2D." );
      return function( canvas ){return canvas.getContext( "2d", {"antialias" : false} );};
    }
    else
    {
      return function( canvas ){return canvas.getContext( "2d" );};
    }
  }
)();
