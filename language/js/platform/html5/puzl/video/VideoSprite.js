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

var SPRITE_ATTRIBUTE_TRANSPARENCY  = 512  // Indicates sprite with transparency
var SPRITE_ATTRIBUTE_ALPHABLEND    = 1024 // Indicates sprite with alpha/semi transparency
var SPRITE_ATTRIBUTE_COLOR         = 2048 // Indicates sprite with color modulation

var SPRITE_COLLISION_RECT          = 0    // Only check if two sprite rectangles intersect
var SPRITE_COLLISION_PIXEL         = 1    // Also check if pixels from two sprite intersect

function VideoSprite( videoImage, cellWidth, cellHeight )
{
  var videoCellImage = new VideoCellImage( videoImage, cellWidth, cellHeight );

  videoCellImage.constructor        = this.constructor;
  videoCellImage.draw               = this.draw;
  videoCellImage.erase              = this.erase;
  videoCellImage.queueErase         = this.queueErase;

  videoCellImage.getXVelocity       = this.getXVelocity;
  videoCellImage.getYVelocity       = this.getYVelocity;
  videoCellImage.setVelocity        = this.setVelocity;
  videoCellImage.setXVelocity       = this.setXVelocity;
  videoCellImage.setYVelocity       = this.setYVelocity;
  videoCellImage.move               = this.move;
  
  videoCellImage.setAttributes      = this.setAttributes;
  videoCellImage.loadFrame          = this.loadFrame;
  videoCellImage.getNumberOfFrames  = this.getNumberOfFrames;
  videoCellImage.setCurrentSequence = this.setCurrentSequence;
  videoCellImage.setCurrentFrame    = this.setCurrentFrame;
  videoCellImage.setAnimationSpeed  = this.setAnimationSpeed;
  videoCellImage.loadAnimation      = this.loadAnimation;
  videoCellImage.animate            = this.animate;

  videoCellImage.xVelocity;
  videoCellImage.yVelocity;

  videoCellImage.constructor();
  return videoCellImage;
}

VideoSprite.prototype.constructor = function()
{
  this.xVelocity = 0;
  this.yVelocity = 0;
  
  this.animation = new Operation();
};

VideoSprite.prototype.draw = function()
{
  //var context = videoObject.getContext();
  if( this.parentObject == null )
  {
    return;
  }
  
  var context = this.parentObject.getContext();
  
  var hasAlpha; // TODO: Optimize. Could allocate this value once for each blockgraphic object.
  if( this.alpha != 1.0 )
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

  if( this.parentObject.display == null )
  {
    DrawWithNearestScale( this, this.parentObject,
                          cell[0], cell[1],
                          this.cellWidth, this.cellHeight,
                          this.position.x, this.position.y,
                          this.width, this.height );
  }
  else
  {
    var videoObjectDisplay = this.parentObject.display;
    var xScale = videoObjectDisplay.xScale;
    var yScale = videoObjectDisplay.yScale;
    
    DrawWithNearestScale( this, this.parentObject,
                          cell[0], cell[1],
                          this.cellWidth, this.cellHeight,
                          ( this.position.x - this.parentObject.getXPosition() ) * xScale,
                          ( this.position.y - this.parentObject.getYPosition() ) * yScale,
                          this.width * xScale, this.height * yScale );
  }
  
  if( hasAlpha )
  {
    context.globalAlpha = 1.0;
  }

  //this.needsRedraw = false;
};

VideoSprite.prototype.erase = function()
{
  var context = this.parentObject.getContext();
  
  if( this.parentObject.display == null )
  {
    context.clearRect( this.position.x, this.position.y,
                       this.width, this.height );
  }
  else
  {
    var videoObjectDisplay = this.parentObject.display;
    var xScale = videoObjectDisplay.xScale;
    var yScale = videoObjectDisplay.yScale;

    context.clearRect( ( this.position.x - this.parentObject.getXPosition() ) * xScale,
                       ( this.position.y - this.parentObject.getYPosition() ) * yScale,
                       this.width * xScale, this.height * yScale );
  }
};

VideoSprite.prototype.queueErase = function()
{
  var videoObjectDisplay = this.parentObject.display;

  var eraseQueueObject = videoObjectDisplay.getNextEraseQueueObject();
  eraseQueueObject.targetVideoObject = this.parentObject; // NOTE: Fix! Could be a display, which has not canvas.
  
  var xScale = videoObjectDisplay.xScale;
  var yScale = videoObjectDisplay.yScale;

  eraseQueueObject.xPosition = ( this.position.x - this.parentObject.getXPosition() ) * xScale;
  eraseQueueObject.yPosition = ( this.position.y - this.parentObject.getYPosition() ) * yScale;
  eraseQueueObject.width     = this.width  * xScale;
  eraseQueueObject.height    = this.height * yScale;
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
  this.setXVelocity( xVelocity );
  this.setYVelocity( yVelocity );
};

VideoSprite.prototype.move = function()
{
  if( ( this.xVelocity != 0 ) || ( this.yVelocity != 0 ) )
  {
    this.queueErase();

    var position = this.position;
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
  this.animation.setNumberOfFrames( this.getNumberOfFrames() );
  return frameIndex;
};

VideoSprite.prototype.getNumberOfFrames = function()
{
  return this.getNumberOfCells();
};

VideoSprite.prototype.setCurrentSequence = function( currentSequence )
{
  this.needsRedraw = true;
  return this.animation.setCurrentSequence( currentSequence );
};

VideoSprite.prototype.setCurrentFrame = function( currentFrame )
{
  this.needsRedraw = true;
  return this.animation.setCurrentFrame( currentFrame );
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
    this.queueErase();
    this.needsRedraw = true;
  }

  return frameChanged;
};
