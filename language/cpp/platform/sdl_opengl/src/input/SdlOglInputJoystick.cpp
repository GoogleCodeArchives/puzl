/*
Copyright (c) 2012, Andrew Dieffenbach. All rights reserved.

This file is part of puzl.

puzl is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

puzl is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
MA 02110-1301  USA
*/

// INCLUDES ======================================================================
#include <puzl/input/SdlOglInputJoystick.h>

#ifdef DEBUG
#include <iostream>
#endif

using namespace std;

// DEFINES =======================================================================

// TYPES =========================================================================

// PROTOTYPES ====================================================================

// EXTERNALS =====================================================================

// GLOBALS =======================================================================

// FUNCTIONS =====================================================================
//--------------------------------------------------------------------------------
SdlOglInputJoystick::SdlOglInputJoystick( void ): CoreInputJoystick()
{
  input = new Input*[NUM_JOYSTICK_BUTTONS + NUM_JOYSTICK_AXES];

	int index;
	
	// Clear the button states.
	buttonState = new Input[NUM_JOYSTICK_BUTTONS];
	for( index = 0; index < NUM_JOYSTICK_BUTTONS; index++ )
	{
	  buttonState[index].id    = index;
	  buttonState[index].type  = INPUT_TYPE_JOYSTICK_BUTTON;
    buttonState[index].state = BUTTON_STATE_UP;
    buttonState[index].value = 0;

    input[index] = &buttonState[index];
	}

	// Clear the axis states.
	axisStateInputOffset = NUM_JOYSTICK_BUTTONS;
	axisState = new Input[NUM_JOYSTICK_AXES];
	for( index = 0; index < NUM_JOYSTICK_AXES; index++ )
	{
		axisState[index].id    = index;
    axisState[index].type  = INPUT_TYPE_JOYSTICK_AXIS;
		axisState[index].state = INPUT_STATE_UP;
		axisState[index].value = AXIS_CENTER_VALUE_MID;

    input[axisStateInputOffset + index] = &axisState[index];
	}
}

//--------------------------------------------------------------------------------
SdlOglInputJoystick::~SdlOglInputJoystick( void )
{
  delete [] buttonState;
  buttonState = NULL;

  delete [] axisState;
  axisState = NULL;

  delete [] input;
  input = NULL;
}

//--------------------------------------------------------------------------------
int SdlOglInputJoystick::initialize( void )
{
	if( CoreInputJoystick::initialize() < 0 )
	{
	  return -1;
	}

	// Switch on the joystick event system.
	if( count == 1 )
	{
		SDL_JoystickEventState( SDL_ENABLE );
	}

	// Open this joystick device for SDL.
	joystick = SDL_JoystickOpen( id );

	// Check if this is a valid joystick.
	if( joystick == NULL )
	{
		#ifdef DEBUG
		cout << "Invalid Joystick(" <<
			id <<
			")" << endl;
		#endif
		
		if( --count == 0 )
		{
			SDL_JoystickEventState( SDL_IGNORE );
		}

		return -1;
	}
	else
	{
		// Get name of this joystick.
		name = SDL_JoystickName( id );

		#ifdef DEBUG
		cout << name << endl;
		#endif
	}

	return 0;
}

//--------------------------------------------------------------------------------
int SdlOglInputJoystick::shutdown( void )
{
  if( CoreInputJoystick::shutdown() < 0 )
  {
    return -1;
  }

	SDL_JoystickClose( joystick );

	// If this is the last active joystick, switch off the joystick event system.
	if( count == 0 )
	{
		SDL_JoystickEventState( SDL_IGNORE );
	}
	
	return 0;
}

//--------------------------------------------------------------------------------
void SdlOglInputJoystick::update( SDL_Event* event )
{
  if( numberOfStateChanges > stateChangeBufferSize )
  {
    return;
  }

	switch( event->type )
	{
		// A joystick axis was moved
		case SDL_JOYAXISMOTION:
		{
			#ifdef DEBUG
			cout << "Joystick(" << ( int )( event->jaxis.which ) << "):  "
				<< "Axis("     << ( int )( event->jaxis.axis  ) << ") "
				<< event->jaxis.value
				<< " Motion" << endl;
			#endif

			static unsigned char& axisId = event->jaxis.axis;
			static short int& axisValue  = event->jaxis.value;

			if( ( axisValue >= AXIS_CENTER_VALUE_MIN ) &&
			    ( axisValue <= AXIS_CENTER_VALUE_MAX ) )
			{
				axisState[axisId].value = AXIS_CENTER_VALUE_MID;
				axisState[axisId].state = INPUT_STATE_RELEASED;
			}
			else
			{
				axisState[axisId].value = ( int )( axisValue );
				axisState[axisId].state = INPUT_STATE_PRESSED;
			}

			stateChange[numberOfStateChanges++] = input[axisStateInputOffset + axisId];

			break;
		}

		// A button was just pressed
		case SDL_JOYBUTTONDOWN:
		{
      #ifdef DEBUG
			cout << "Joystick(" << ( int )( event->jbutton.which  ) << "):  "
				<< "Button("   << ( int )( event->jbutton.button )<< ")"
				<< " Down" << endl;
			#endif

			static unsigned char& buttonId = event->jbutton.button;
			buttonState[buttonId].state = BUTTON_STATE_PRESSED;

      stateChange[numberOfStateChanges++] = input[buttonId];

			break;
		}

		// A button was just released
		case SDL_JOYBUTTONUP:
		{
      #ifdef DEBUG
			cout << "Joystick(" << ( int )( event->jbutton.which  ) << "):  "
				<< "Button("   << ( int )( event->jbutton.button )<< ")"
				<< " Released" << endl;
			#endif

			static unsigned char& buttonId = event->jbutton.button;
			buttonState[buttonId].state = BUTTON_STATE_RELEASED;

			stateChange[numberOfStateChanges++] = input[buttonId];

			break;
		}
	}
}

