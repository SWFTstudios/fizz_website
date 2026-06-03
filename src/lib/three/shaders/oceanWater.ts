import {
  BackSide,
  Color,
  DoubleSide,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  UniformsUtils,
} from "three"
import type { FuturisticGradient } from "../../../data/bottleGradients"

export type ShaderOceanMeshes = {
  water: Mesh
  sky: Mesh
  material: ShaderMaterial
  skyMaterial: ShaderMaterial
}

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uWaveScale;
uniform float uWaveHeight;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying float vElevation;

void main() {
  vec3 pos = position;
  float wave1 = sin(pos.x * 0.35 + uTime * 0.9) * cos(pos.z * 0.28 + uTime * 0.7);
  float wave2 = sin(pos.x * 0.12 - uTime * 0.45 + pos.z * 0.18) * 0.6;
  float wave3 = cos(pos.z * 0.22 + uTime * 0.55) * sin(pos.x * 0.08) * 0.4;
  float elevation = (wave1 + wave2 + wave3) * uWaveHeight;
  pos.y += elevation;
  vElevation = elevation;

  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPosition.xyz;

  float dx = cos(pos.x * 0.35 + uTime * 0.9) * 0.35 * uWaveHeight;
  float dz = -sin(pos.z * 0.28 + uTime * 0.7) * 0.28 * uWaveHeight;
  vNormal = normalize(vec3(-dx, 1.0, -dz));

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`

const fragmentShader = /* glsl */ `
uniform vec3 uDeepColor;
uniform vec3 uMidColor;
uniform vec3 uHighlightColor;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying float vElevation;

void main() {
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 normal = normalize(vNormal);
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
  float spec = pow(max(dot(reflect(-viewDir, normal), viewDir), 0.0), 48.0);

  vec3 base = mix(uDeepColor, uMidColor, smoothstep(-0.08, 0.12, vElevation));
  vec3 waterColor = mix(base, uHighlightColor, fresnel * 0.55 + spec * 0.35);

  float fogFactor = smoothstep(uFogNear, uFogFar, length(cameraPosition - vWorldPosition));
  waterColor = mix(waterColor, uFogColor, fogFactor);

  gl_FragColor = vec4(waterColor, 0.94);
}
`

const skyVertexShader = /* glsl */ `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`

const skyFragmentShader = /* glsl */ `
uniform vec3 uTopColor;
uniform vec3 uBottomColor;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

varying vec3 vWorldPosition;

void main() {
  float h = normalize(vWorldPosition).y * 0.5 + 0.5;
  vec3 sky = mix(uBottomColor, uTopColor, smoothstep(0.0, 1.0, h));
  float fogFactor = smoothstep(uFogNear, uFogFar, length(cameraPosition - vWorldPosition));
  sky = mix(sky, uFogColor, fogFactor * 0.35);
  gl_FragColor = vec4(sky, 1.0);
}
`

export function createShaderOceanMeshes(initial: FuturisticGradient): ShaderOceanMeshes {
  const deep = new Color(initial.deep)
  const mid = new Color(initial.mid)
  const highlight = new Color(initial.highlight)

  const uniforms = UniformsUtils.merge([
    {
      uTime: { value: 0 },
      uWaveScale: { value: 1 },
      uWaveHeight: { value: 0.14 },
      uDeepColor: { value: deep.clone() },
      uMidColor: { value: mid.clone() },
      uHighlightColor: { value: highlight.clone() },
      uFogColor: { value: deep.clone() },
      uFogNear: { value: 4 },
      uFogFar: { value: 28 },
    },
  ])

  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    side: DoubleSide,
  })

  const waterGeo = new PlaneGeometry(200, 200, 128, 128)
  waterGeo.rotateX(-Math.PI / 2)
  waterGeo.translate(0, -0.55, 0)

  const water = new Mesh(waterGeo, material)
  water.name = "shaderWaterPlane"
  water.receiveShadow = true

  const skyUniforms = UniformsUtils.merge([
    {
      uTopColor: { value: highlight.clone().lerp(deep, 0.35) },
      uBottomColor: { value: mid.clone() },
      uFogColor: { value: deep.clone() },
      uFogNear: { value: 4 },
      uFogFar: { value: 28 },
    },
  ])

  const skyMaterial = new ShaderMaterial({
    uniforms: skyUniforms,
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    side: BackSide,
    depthWrite: false,
  })

  const sky = new Mesh(new SphereGeometry(80, 48, 24), skyMaterial)
  sky.name = "shaderSkySphere"
  sky.position.y = 1.5

  return { water, sky, material, skyMaterial }
}

export function updateShaderOceanColors(
  meshes: ShaderOceanMeshes,
  g: FuturisticGradient,
): void {
  const deep = new Color(g.deep)
  const mid = new Color(g.mid)
  const highlight = new Color(g.highlight)

  meshes.material.uniforms.uDeepColor.value.copy(deep)
  meshes.material.uniforms.uMidColor.value.copy(mid)
  meshes.material.uniforms.uHighlightColor.value.copy(highlight)
  meshes.material.uniforms.uFogColor.value.copy(deep)

  meshes.skyMaterial.uniforms.uTopColor.value.copy(highlight.clone().lerp(deep, 0.35))
  meshes.skyMaterial.uniforms.uBottomColor.value.copy(mid)
  meshes.skyMaterial.uniforms.uFogColor.value.copy(deep)
}

export function tickShaderOcean(meshes: ShaderOceanMeshes, elapsed: number): void {
  meshes.material.uniforms.uTime.value = elapsed
}
