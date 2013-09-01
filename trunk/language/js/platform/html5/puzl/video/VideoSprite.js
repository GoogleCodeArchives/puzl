var SPRITE_STATE_ANIM_RUNNING      = 1    // Sprite is done animating
var SPRITE_STATE_ANIM_DONE         = 2    // Sprite is currently animating
var SPRITE_STATE_ANIM_RESET        = 4    // Sprite is has reset animation
var SPRITE_STATE_DEAD              = 8    // Sprite is dead
var SPRITE_STATE_ALIVE             = 16   // Sprite is alive
var SPRITE_STATE_DYING             = 32   // Sprite is dying
var SPRITE_STATE_CUSTOM_0          = 64   // Custom state for sprite 0.
var SPRITE_STATE_CUSTOM_1          = 128  // Custom state for sprite 1.
var SPRITE_STATE_CUSTOM_2          = 256  // Custom state for sprite 2.
var SPRITE_STATE_CUSTOM_3          = 512  // Custom state for sprite 3.

var SPRITE_ATTRIBUTE_SINGLE_FRAME  = 1    // Sprite has single frame
var SPRITE_ATTRIBUTE_MULTI_FRAME   = 2    // Sprite has multiple frames
var SPRITE_ATTRIBUTE_MULTI_ANIM    = 4    // Sprite has multiple animations
var SPRITE_ATTRIBUTE_ANIM_ONE_SHOT = 8    // Sprite will perform the animation once
var SPRITE_ATTRIBUTE_VISIBLE       = 16   // Sprite is visible
var SPRITE_ATTRIBUTE_BOUNCE        = 32   // Sprite bounces off edges
var SPRITE_ATTRIBUTE_WRAPAROUND    = 64   // Sprite wraps around edges
var SPRITE_ATTRIBUTE_LOADED        = 128  // Sprite has been loaded
var SPRITE_ATTRIBUTE_CLONE         = 256  // Sprite is a clone

var SPRITE_ATTRIBUTE_TRANSPARENCY  = 1024 // Indicates sprite with transparency
var SPRITE_ATTRIBUTE_ALPHABLEND    = 2048 // Indicates sprite with alpha/semi transparency
var SPRITE_ATTRIBUTE_COLOR         = 4096 // Indicates sprite with color modulation

var SPRITE_COLLISION_RECT          = 0    // Only check if two sprite rectangles intersect
var SPRITE_COLLISION_PIXEL         = 1    // Also check if pixels from two sprite intersect

function VideoSprite( sourceVideoObject, videoSpriteData )
{
  //console.log( "Creating VideoSprite" );
  VideoCellImage.call( this, sourceVideoObject, videoSpriteData );

  this.xVelocity;
  this.yVelocity;

  this.animation;
  this.animationNameIndexHash;

  // Constructor.
  if( sourceVideoObject === undefined )
  {
    // TODO: Allow for such in the future?
    console.error( "Attempting to load VideoSprite without source VideoObject." );
    return null;
  }

  if( videoSpriteData === undefined )
  {
    // TODO: Allow for such in the future?
    console.error( "Attempting to load VideoSprite without driving data." );
    return null;
  }
  
  this.xVelocity = 0;
  this.yVelocity = 0;

  this.animation = new Operation();
  this.animationNameIndexHash = new Array();

  // Load animations from videoSpriteData.
  var animations = videoSpriteData["animations"];
  if( animations !== undefined )
  {
    var animation;
    for( var animationName in animations )
    {
      //console.log( animationName );
      animation = animations[animationName];

      // TODO: Optimize...
      var indexedAnimation = new Array();
      var animationIndex;
      for( animationIndex in animation )
      {
        var animationFrameName = animation[animationIndex];
        indexedAnimation[animationIndex] = this.cellNameIndexHash[animationFrameName];
        //console.log( animationIndex );
      }
      indexedAnimation[++animationIndex] = -1;

      this.animationNameIndexHash[animationName] = this.loadAnimation( indexedAnimation );
    }
  }
  else
  {
    //console.warn( "Loading VideoSprite without animation information." );
  }
}

extend( VideoSprite, VideoCellImage );

VideoSprite.prototype.drawTo = function( targetVideoObject, rectangle )
{
  if( targetVideoObject === null )
  {
    return;
  }

  var context = targetVideoObject.context;
  
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
  
  var cell = this.cellList[this.animation.getCurrentFrame()];
  if( cell === null )
  {
    return;
  }

  var rectangleStartPoint = rectangle.startPoint;
  var rectangleStartX = rectangleStartPoint.x;
  var rectangleStartY = rectangleStartPoint.y;
  var thisStartPoint = this.startPoint;
  var xOffset = rectangleStartX - thisStartPoint.x;
  var yOffset = rectangleStartY - thisStartPoint.y;
  var rectangleEndPoint = rectangle.endPoint;
  var rectangleWidth  = rectangleEndPoint.x - rectangleStartX + 1;
  var rectangleHeight = rectangleEndPoint.y - rectangleStartY + 1;

  // TODO: Needs to factor in scaled dimensions.
  context.drawImage( this.canvas,
                     cell[0] + xOffset, cell[1] + yOffset,

                     rectangleWidth,
                     rectangleHeight,

                     rectangleStartX, rectangleStartY,

                     rectangleWidth,
                     rectangleHeight );
  
  if( hasAlpha )
  {
    context.globalAlpha = 1;
  }
};

VideoSprite.prototype.getXVelocity = function()
{
  return this.xVelocity;
};

VideoSprite.prototype.getYVelocity = function()
{
  return this.yVelocity;
};

VideoSprite.prototype.setXVelocity = function( xVelocity )
{
  this.xVelocity = xVelocity;
};

VideoSprite.prototype.setYVelocity = function( yVelocity )
{
  this.yVelocity = yVelocity;
};

VideoSprite.prototype.setVelocity = function( xVelocity, yVelocity )
{
  this.xVelocity = xVelocity;
  this.yVelocity = yVelocity;
};

VideoSprite.prototype.move = function()
{
  if( ( this.xVelocity !== 0 ) || ( this.yVelocity !== 0 ) )
  {
    var position = this.startPoint;
    this.setPosition( position.x + this.xVelocity,
                      position.y + this.yVelocity );
    
    return true;
  }

  return false;
};

VideoSprite.prototype.setAttributes = function( attributes )
{
  return this.animation.setAttributes( attributes );
};

VideoSprite.prototype.loadFrame = function( xPosition, yPosition, mode )
{
  var frameIndex = this.loadCell( xPosition, yPosition, mode );
  return frameIndex;
};

VideoSprite.prototype.getNumberOfFrames = function()
{
  return this.getNumberOfCells();
};

VideoSprite.prototype.getCurrentSequence = function()
{
  return this.animation.currentSequence;
};

VideoSprite.prototype.setCurrentSequence = function( currentSequence )
{
  //console.log( currentSequence );
  var thisAnimation = this.animation;
  var previousFrame = thisAnimation.getCurrentFrame();
  
  thisAnimation.setCurrentSequence( currentSequence );
  if( previousFrame !== thisAnimation.getCurrentFrame() )
  {
    this.targetVideoObject.addDirtyRectangle( this );
  }
};

VideoSprite.prototype.setCurrentFrame = function( currentFrame )
{
  var thisAnimation = this.animation;
  
  if( currentFrame !== thisAnimation.getCurrentFrame() )
  {
    this.targetVideoObject.addDirtyRectangle( this );
  }
  
  thisAnimation.setCurrentFrame( currentFrame );
};

VideoSprite.prototype.setCurrentFrameByName = function( frameName )
{
  //console.log( "Frame index: " + this.cellNameIndexHash[frameName] );
  this.setCurrentFrame( this.cellNameIndexHash[frameName] );
};

VideoSprite.prototype.setAnimationSpeed = function( animationSpeed )
{
  return this.animation.setSpeed( animationSpeed );
};

VideoSprite.prototype.loadAnimation = function( animation )
{
  return this.animation.load( animation );
};

VideoSprite.prototype.animate = function()
{
  var frameChanged = this.animation.read();
  if( frameChanged )
  {
    this.targetVideoObject.addDirtyRectangle( this );
  }

  return frameChanged;
};
