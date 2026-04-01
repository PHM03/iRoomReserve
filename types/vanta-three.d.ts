declare module 'three' {
  const THREE: any;
  export = THREE;
}

declare module 'vanta/dist/vanta.birds.min' {
  interface VantaEffect {
    destroy: () => void;
  }

  type VantaBirds = (options: Record<string, unknown>) => VantaEffect;

  const BIRDS: VantaBirds;
  export default BIRDS;
}
