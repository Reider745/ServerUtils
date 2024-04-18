function angleFor2dVector(x1, y1, x2, y2){
	let v = Math.acos((x1*x2+y1*y2) / (Math.sqrt(x1 * x1 + y1 * y1)*Math.sqrt(x2 * x2 + y2 * y2)))
	return isNaN(v) ? 0 : v;
}

function angleFor3dVector(x1, y1, z1, x2, y2, z2){
	let v = Math.acos((x1*x2+y1*y2+z1*z2) / (Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1)*Math.sqrt(x2 * x2 + y2 * y2 + z2 * z2)));
	return isNaN(v) ? 0 : v;
}

function rotateMesh(mesh, x1, x2, y1, y2, dx, dy, dz, radius){
	const angleXZ = angleFor2dVector(0, radius, dx, dz);
	
	if(dx == 0 && dz == 0)
		var angleY = Math.PI/2;
	else
		var angleY = angleFor3dVector(dx, 0, dz, dx, dy, dz);
	
	mesh.rotate(0 < y2-y1 ? -angleY : angleY, 0 < x2-x1 ? -angleXZ : angleXZ, 0);
}