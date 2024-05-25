import React, { useEffect, useState } from "react";
import WorldMap, { MapProps } from "./components/map";

// This component is for development purpose (to see if the map works)
// Should be replaced by another component once the map function is confirmed
const MapPage = () => {
	return (
		<div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
			<WorldMap />
		</div>
	);
};

export default MapPage;
