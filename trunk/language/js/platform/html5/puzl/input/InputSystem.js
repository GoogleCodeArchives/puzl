function InputSystem()
{
  this.numberOfKeyboards;
  this.numberOfMice;
  this.numberOfJoysticks;
  
  this.keyboards;
  this.mice;
  
  this.joysticks;
  this.supportsGamepads;
  
  this.constructor();
  return this;
}

InputSystem.prototype.constructor = function()
{
  this.numberOfKeyboards = 1;
  this.numberOfMice      = 1;

  this.keyboards = new Array( this.numberOfKeyboards );
  this.mice      = new Array( this.numberOfMice );

  var index;
  for( index = 0; index < this.numberOfKeyboards; index++ )
  {
    this.keyboards[index] = new InputKeyboard();
  }

  for( index = 0; index < this.numberOfMice; index++ )
  {
    this.mice[index] = new InputMouse();
  }

  // Gamepad support (with shim).
  if( navigator.getGamepads === undefined )
  {
    navigator.getGamepads =
    (
      function()
      {
        if( "webkitGetGamepads" in navigator )
        {
          return navigator.webkitGetGamepads;
        }

        if( "mozGetGamepads" in navigator )
        {
          return navigator.mozGetGamepads;
        }

        // Older outdated approach.
        if( "webkitGamepads" in navigator )
        {
          return function(){ return navigator.webkitGamepads; };
        }
        if( "mozGamepads" in navigator )
        {
          return function(){ return navigator.mozGamepads; };
        }

        // Return undefined for no support.
        return;
      }
    )();
  }
  
  this.supportsGamepads = ( navigator.getGamepads !== undefined ) ? true : false;
  if( this.supportsGamepads )
  {
    // TODO: Make this code Firefox friendly.
    var gamepadList = navigator.getGamepads();
    if( gamepadList !== null )
    {
      //console.log( gamepadList );
      
      // Determine actual number of valid / defined gamepads.
      this.numberOfJoysticks = 0;
      for( index = 0; index < gamepadList.length; index++ )
      {
        if( gamepadList[index] !== undefined )
        {
          this.numberOfJoysticks++;
        }
      }
    }
    else
    {
      this.numberOfJoysticks = 0;
    }

    if( this.numberOfJoysticks !== 0 )
    {
      this.joysticks = new Array( this.numberOfJoysticks );
      for( index = 0; index < this.numberOfJoysticks; index++ )
      {
        this.joysticks[index] = new InputJoystick();
      }
    }
    else
    {
      this.joysticks = new Array();
    }
  }
};

InputSystem.prototype.getKeyboard = function( id )
{
  return this.keyboards[id];
};

InputSystem.prototype.getMouse = function( id )
{
  return this.mice[id];
};

InputSystem.prototype.getJoysticks = function()
{
  return this.joysticks;
};

InputSystem.prototype.getJoystick = function( id )
{
  return this.joysticks[id];
};

InputSystem.prototype.update = function()
{
  var index;
  if( this.numberOfKeyboards > 0 )
  {
    for( index = 0; index < this.numberOfKeyboards; index++ )
    {
      this.keyboards[index].age();
    }
  }

  if( this.numberOfMice > 0 )
  {
    for( index = 0; index < this.numberOfMice; index++ )
    {
      this.mice[index].age();
    }
  }

  if( this.numberOfJoysticks > 0 )
  {
    for( index = 0; index < this.numberOfJoysticks; index++ )
    {
      this.joysticks[index].age();
    }

    var gamepadList = navigator.getGamepads();
    if( gamepadList != null )
    {
      var gamepad;
      for( index = 0; index < gamepadList.length; index++ )
      {
        gamepad = gamepadList[index];
        if( gamepad !== undefined )
        {
          // TODO: Only call this update when timestamp differs from last
          // attempt?
          this.joysticks[index].updateWithGamepad( gamepad );
        }
      }
    }
  }
};
