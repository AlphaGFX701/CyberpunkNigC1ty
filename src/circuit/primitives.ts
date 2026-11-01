import { BoxGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial } from 'three'

type Triple = [number, number, number]
export function material(color: string, emissive = false) {
  return new MeshStandardMaterial({
    color,
    metalness: 0.55,
    roughness: 0.53,
    emissive: emissive ? color : '#000000',
    emissiveIntensity: emissive ? 0.65 : 0,
  })
}
export function box(
  parent: Group,
  position: Triple,
  size: Triple,
  color: string,
  emissive = false
) {
  const item = new Mesh(new BoxGeometry(...size), material(color, emissive))
  item.position.set(...position)
  parent.add(item)
  return item
}
export function cylinder(
  parent: Group,
  position: Triple,
  radius: number,
  height: number,
  color: string,
  emissive = false
) {
  const item = new Mesh(new CylinderGeometry(radius, radius, height, 10), material(color, emissive))
  item.position.set(...position)
  parent.add(item)
  return item
}
