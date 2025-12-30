// Walls.js
import React from 'react';
import './walls.css'; // Importing the specific CSS for the walls

/**
 * Component to render the walls at the boundaries of the game world.
 * @param {object} props - The properties passed to the component.
 * @param {number} props.worldWidth - The width of the game world.
 * @param {number} props.worldHeight - The height of the game world.
 * @param {number} props.wallThickness - The thickness of the walls.
 * @returns {JSX.Element} The rendered walls.
 */
const Walls = ({ worldWidth, worldHeight, wallThickness }) => {
  return (
    <>
      {/* Top Wall */}
      <div
        className="wall wall-top"
        style={{
          height: wallThickness,
          width: worldWidth,
        }}
      />
      {/* Bottom Wall */}
      <div
        className="wall wall-bottom"
        style={{
          height: wallThickness,
          width: worldWidth,
        }}
      />
      {/* Left Wall */}
      <div
        className="wall wall-left"
        style={{
          width: wallThickness,
          height: worldHeight,
        }}
      />
      {/* Right Wall */}
      <div
        className="wall wall-right"
        style={{
          width: wallThickness,
          height: worldHeight,
        }}
      />
    </>
  );
};

export default Walls;
