/** @constructor */
function BlockGraphic( sourceVideoObject, blockgraphicData )
{
  // console.log( "Creating BlockGraphic" );
  VideoCellImage.call( this, sourceVideoObject, blockgraphicData );
  
  this.PRINT_ATTR_ALIGN_LEFT  = 0;
  this.PRINT_ATTR_ALIGN_RIGHT = 1;
  this.PRINT_ATTR_ALIGN_TOP   = 2;

  /*this.absolute;
  this.replace;

  this.alignment;

  this.codeToCellTable;*/
  
  // Constructor.
  if( sourceVideoObject === undefined )
  {
    // TODO: Allow for such in the future?
    console.error( "Attempting to load BlockGraphic without source VideoObject." );
    return null;
  }

  if( blockgraphicData === undefined )
  {
    // TODO: Allow for such in the future?
    console.error( "Attempting to load BlockGraphic without driving data." );
    return null;
  }

  this.absolute = false;
  this.replace = true;

  this.alignment = this.PRINT_ATTR_ALIGN_LEFT;
  
  this.setPosition( 0, 0 );

  // Populate character code to cell lookup table.
  this.codeToCellTable = new Array();
  var codeToFramePartitions = blockgraphicData["codeToFramePartitions"];
  if( codeToFramePartitions !== undefined )
  {
    //this.cellNameIndexHash
    var numberOfPartitions = codeToFramePartitions.length;
    var partitionIndex;
    for( partitionIndex = 0; partitionIndex < numberOfPartitions; partitionIndex++ )
    {
      var partition = codeToFramePartitions[partitionIndex];
      var codeBase = partition["codeBase"];

      var frames = partition["frames"];
      var numberOfFrames = frames.length;
      var frameIndex;
      for( frameIndex = 0; frameIndex < numberOfFrames; frameIndex++ )
      {
        var frameId = frames[frameIndex];
        this.codeToCellTable[codeBase + frameIndex] = this.cellList[this.cellNameIndexHash[frameId]];

        // NOTE: It's important to know that undefined elements are padded
        // into the codeToCellTable array, if 'codeBase + frameIndex' is not equal
        // to the current length of the array.
      }
    }
  }
  else
  {
    console.error( "Attempting to load BlockGraphic without code to frame data." );
    return null;
  }
};

extend( BlockGraphic, VideoCellImage );

/*BlockGraphic.prototype.setPositionGridCellDimensions = function( positionGridCellWidth, positionGridCellHeight )
{
  this.positionGridCellWidth  = positionGridCellWidth;
  this.positionGridCellHeight = positionGridCellHeight;
};*/

BlockGraphic.prototype.print = function( text )
{
  if( text === undefined )
  {
    return;
  }
  
  var isString;
  var length;
  if( text.length !== undefined ) // TODO: REALLY crummy way to determine if text is string.
  {
    length = text.length;
    if( length < 1 )
    {
      return;
    }

    isString = true;
  }
  else
  {
    length = 1;
    isString = false;
  }

  var thisCanvas = this.canvas;
  
  var targetVideoObject = this.targetVideoObject;
  var context = targetVideoObject.context;
  
  var targetTargetVideoObject = targetVideoObject.targetVideoObject;

  var hasAlpha; // TODO: Optimize. Could allocate this value once for each blockgraphic object.
  if( this.alpha !== 1 )
  {
    hasAlpha = true;
    context.globalAlpha = this.alpha;
  }
  else
  {
    hasAlpha = false;
  }

  var xPosition = VideoCellImage.prototype.getXPosition.call( this );
  var yPosition = VideoCellImage.prototype.getYPosition.call( this );

  var thisWidth  = this._width;
  var thisHeight = this._height;
  
  var printWidth  = 0;
  var printHeight = 0;

  var alignment = this.alignment;
  if( alignment === this.PRINT_ATTR_ALIGN_LEFT )
  {
    printWidth  = length * thisWidth;
    printHeight = thisHeight;
    
    VideoCellImage.prototype.setPosition.call( this, xPosition + printWidth, yPosition );
  }
  else
  if( alignment === this.PRINT_ATTR_ALIGN_RIGHT )
  {
    printWidth  = length * thisWidth;
    printHeight = thisHeight;
    
    xPosition -= printWidth;
    VideoCellImage.prototype.setPosition.call( this, xPosition, yPosition );
  }
  else
  if( alignment === this.PRINT_ATTR_ALIGN_TOP )
  {
    printWidth  = thisWidth;
    printHeight = length * thisHeight;
    
    VideoCellImage.prototype.setPosition.call( this, xPosition, yPosition + printHeight );
  }
  else
  {
    console.error( "BlockGraphic::print:  Unimplemented alignment:  " + this.alignment );
    return;
  }

  if( targetTargetVideoObject )
  {
    var tempDirtyRectangle = this.tempDirtyRectangle;
    var tempDirtyRectangleStartPoint = tempDirtyRectangle.startPoint;
    tempDirtyRectangleStartPoint.x = xPosition;
    tempDirtyRectangleStartPoint.y = yPosition;
    var tempDirtyRectangleEndPoint = tempDirtyRectangle.endPoint;
    tempDirtyRectangleEndPoint.x = xPosition + printWidth  - 1;
    tempDirtyRectangleEndPoint.y = yPosition + printHeight - 1;
  }
  
  if( this.replace )
  {
    context.clearRect( xPosition, yPosition, printWidth, printHeight );
  }

  var thisCellWidth  = this.cellWidth;
  var thisCellHeight = this.cellHeight;

  var thisCodeToCellTable = this.codeToCellTable;

  var cell;

  if( isString )
  {
    var character;
    var characterCode;
    for( var index = 0; index < length; index++ )
    {
      character = text.charAt( index );
      /*if( character === '\n' )
      {
        xPosition = 0;
        yPosition += this.height;
        continue;
      }*/

      characterCode = character.charCodeAt( 0 );
      if( characterCode !== 32 )
      {
        cell = thisCodeToCellTable[characterCode];
        if( cell !== undefined )
        {
          context.drawImage( thisCanvas,
                             cell[0], cell[1],
                             thisCellWidth, thisCellHeight,
                             xPosition, yPosition,
                             thisWidth, thisHeight );
        }
      }

      if( alignment !== this.PRINT_ATTR_ALIGN_TOP )
      {
        xPosition += thisWidth;
      }
      else
      {
        yPosition += thisHeight;
      }
    }

    if( targetTargetVideoObject )
    {
      targetTargetVideoObject.addDirtyRectangle( this.tempDirtyRectangle );
    }
  }
  else
  {
    cell = thisCodeToCellTable[text];
    if( cell !== undefined )
    {
      if( characterCode !== 0 )
      {
        context.drawImage( thisCanvas,
                           cell[0], cell[1],
                           thisCellWidth, thisCellHeight,
                           xPosition, yPosition,
                           thisWidth, thisHeight );

        if( targetTargetVideoObject )
        {
          targetTargetVideoObject.addDirtyRectangle( this.tempDirtyRectangle );
        }
      }
    }

    if( alignment !== this.PRINT_ATTR_ALIGN_TOP )
    {
      xPosition += thisWidth;
    }
    else
    {
      yPosition += thisHeight;
    }
  }

  if( hasAlpha )
  {
    context.globalAlpha = 1;
  }
};

// Used to just clear out text space.
BlockGraphic.prototype.clearPrint = function( length )
{
  // TODO: This function could (and should probably) be consolidated with print().
  var targetVideoObject = this.targetVideoObject;
  var context = targetVideoObject.context;
  
  var targetTargetVideoObject = targetVideoObject.targetVideoObject;

  var hasAlpha; // TODO: Optimize. Could allocate this value once for each blockgraphic object.
  if( this.alpha !== 1 )
  {
    hasAlpha = true;
    context.globalAlpha = this.alpha;
  }
  else
  {
    hasAlpha = false;
  }

  var xPosition = VideoCellImage.prototype.getXPosition.call( this );
  var yPosition = VideoCellImage.prototype.getYPosition.call( this );

  var thisWidth  = this._width;
  var thisHeight = this._height;
  
  var printWidth  = 0;
  var printHeight = 0;

  var alignment = this.alignment;
  if( alignment === this.PRINT_ATTR_ALIGN_LEFT )
  {
    printWidth  = length * thisWidth;
    printHeight = thisHeight;
    
    VideoCellImage.prototype.setPosition.call( this, xPosition + printWidth, yPosition );
  }
  else
  if( alignment === this.PRINT_ATTR_ALIGN_RIGHT )
  {
    printWidth  = length * thisWidth;
    printHeight = thisHeight;
    
    xPosition -= printWidth;
    VideoCellImage.prototype.setPosition.call( this, xPosition, yPosition );
  }
  else
  if( alignment === this.PRINT_ATTR_ALIGN_TOP )
  {
    printWidth  = thisWidth;
    printHeight = length * thisHeight;
    
    VideoCellImage.prototype.setPosition.call( this, xPosition, yPosition + printHeight );
  }
  else
  {
    console.error( "BlockGraphic::print:  Unimplemented alignment:  " + this.alignment );
    return;
  }

  if( targetTargetVideoObject )
  {
    var tempDirtyRectangle = this.tempDirtyRectangle;
    var tempDirtyRectangleStartPoint = tempDirtyRectangle.startPoint;
    tempDirtyRectangleStartPoint.x = xPosition;
    tempDirtyRectangleStartPoint.y = yPosition;
    var tempDirtyRectangleEndPoint = tempDirtyRectangle.endPoint;
    tempDirtyRectangleEndPoint.x = xPosition + printWidth  - 1;
    tempDirtyRectangleEndPoint.y = yPosition + printHeight - 1;
  }
  
  context.clearRect( xPosition, yPosition, printWidth, printHeight );
  
  if( targetTargetVideoObject )
  {
    targetTargetVideoObject.addDirtyRectangle( this.tempDirtyRectangle );
  }
  
  if( alignment !== this.PRINT_ATTR_ALIGN_TOP )
  {
    xPosition += thisWidth * length;
  }
  else
  {
    yPosition += thisHeight * length;
  }
};

BlockGraphic.prototype.setPosition = function( xPosition, yPosition )
{
  if( this.absolute !== true )
  {
    xPosition *= this.cellWidth;
    yPosition *= this.cellHeight;
  }
  
  VideoCellImage.prototype.setPosition.call( this, xPosition, yPosition );
};

BlockGraphic.prototype.getXPosition = function()
{
  var xPosition = VideoCellImage.prototype.getXPosition.call( this );
  
  if( this.absolute === true )
  {
    return xPosition;
  }

  return ( xPosition / this.cellWidth ) | 0;
};

BlockGraphic.prototype.getYPosition = function()
{
  var yPosition = VideoCellImage.prototype.getYPosition.call( this );

  if( this.absolute === true )
  {
    return yPosition;
  }

  return ( yPosition / this.cellHeight ) | 0;
};

