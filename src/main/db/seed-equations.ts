import type { EquationVariable } from '@shared/types'
import { getDb } from './database'

interface Seed {
  name: string
  latex: string
  category: string
  description?: string
  variables?: EquationVariable[]
  tags?: string[]
}

const R = String.raw

/** Built-in physics equation library, seeded on first run. */
const SEEDS: Seed[] = [
  // ---- Kinematics ----
  {
    name: 'Velocity (constant acceleration)',
    latex: R`v = u + at`,
    category: 'Kinematics',
    variables: [
      { symbol: 'v', meaning: 'final velocity', unit: 'm/s' },
      { symbol: 'u', meaning: 'initial velocity', unit: 'm/s' },
      { symbol: 'a', meaning: 'acceleration', unit: 'm/s²' },
      { symbol: 't', meaning: 'time', unit: 's' }
    ]
  },
  {
    name: 'Displacement (constant acceleration)',
    latex: R`s = ut + \tfrac{1}{2}at^2`,
    category: 'Kinematics',
    variables: [
      { symbol: 's', meaning: 'displacement', unit: 'm' },
      { symbol: 'u', meaning: 'initial velocity', unit: 'm/s' },
      { symbol: 'a', meaning: 'acceleration', unit: 'm/s²' },
      { symbol: 't', meaning: 'time', unit: 's' }
    ]
  },
  {
    name: 'Torricelli equation',
    latex: R`v^2 = u^2 + 2as`,
    category: 'Kinematics',
    variables: [
      { symbol: 'v', meaning: 'final velocity', unit: 'm/s' },
      { symbol: 'u', meaning: 'initial velocity', unit: 'm/s' },
      { symbol: 'a', meaning: 'acceleration', unit: 'm/s²' },
      { symbol: 's', meaning: 'displacement', unit: 'm' }
    ]
  },
  {
    name: 'Displacement (average velocity)',
    latex: R`s = \tfrac{1}{2}(u + v)\,t`,
    category: 'Kinematics'
  },

  // ---- Dynamics ----
  {
    name: "Newton's second law",
    latex: R`\vec{F} = m\vec{a}`,
    category: 'Dynamics',
    description: 'Net force equals mass times acceleration.',
    variables: [
      { symbol: 'F', meaning: 'net force', unit: 'N' },
      { symbol: 'm', meaning: 'mass', unit: 'kg' },
      { symbol: 'a', meaning: 'acceleration', unit: 'm/s²' }
    ],
    tags: ['force', 'newton']
  },
  {
    name: "Newton's second law (momentum form)",
    latex: R`\vec{F} = \frac{d\vec{p}}{dt}`,
    category: 'Dynamics'
  },
  {
    name: 'Weight',
    latex: R`W = mg`,
    category: 'Dynamics',
    variables: [
      { symbol: 'W', meaning: 'weight', unit: 'N' },
      { symbol: 'm', meaning: 'mass', unit: 'kg' },
      { symbol: 'g', meaning: 'gravitational field', unit: 'm/s²' }
    ]
  },
  {
    name: 'Friction force',
    latex: R`f = \mu N`,
    category: 'Dynamics',
    variables: [
      { symbol: 'f', meaning: 'friction force', unit: 'N' },
      { symbol: '\\mu', meaning: 'coefficient of friction' },
      { symbol: 'N', meaning: 'normal force', unit: 'N' }
    ]
  },

  // ---- Work & Energy ----
  {
    name: 'Work',
    latex: R`W = Fd\cos\theta`,
    category: 'Work & Energy',
    variables: [
      { symbol: 'W', meaning: 'work', unit: 'J' },
      { symbol: 'F', meaning: 'force', unit: 'N' },
      { symbol: 'd', meaning: 'displacement', unit: 'm' },
      { symbol: '\\theta', meaning: 'angle between F and d' }
    ]
  },
  {
    name: 'Kinetic energy',
    latex: R`E_k = \tfrac{1}{2}mv^2`,
    category: 'Work & Energy',
    variables: [
      { symbol: 'E_k', meaning: 'kinetic energy', unit: 'J' },
      { symbol: 'm', meaning: 'mass', unit: 'kg' },
      { symbol: 'v', meaning: 'speed', unit: 'm/s' }
    ]
  },
  {
    name: 'Gravitational potential energy',
    latex: R`E_p = mgh`,
    category: 'Work & Energy',
    variables: [
      { symbol: 'E_p', meaning: 'potential energy', unit: 'J' },
      { symbol: 'h', meaning: 'height', unit: 'm' }
    ]
  },
  {
    name: 'Elastic potential energy',
    latex: R`E = \tfrac{1}{2}kx^2`,
    category: 'Work & Energy',
    variables: [
      { symbol: 'k', meaning: 'spring constant', unit: 'N/m' },
      { symbol: 'x', meaning: 'extension', unit: 'm' }
    ]
  },
  { name: 'Power (work)', latex: R`P = \frac{W}{t}`, category: 'Work & Energy' },
  { name: 'Power (force × velocity)', latex: R`P = Fv`, category: 'Work & Energy' },

  // ---- Momentum ----
  {
    name: 'Momentum',
    latex: R`\vec{p} = m\vec{v}`,
    category: 'Momentum',
    variables: [
      { symbol: 'p', meaning: 'momentum', unit: 'kg·m/s' },
      { symbol: 'm', meaning: 'mass', unit: 'kg' },
      { symbol: 'v', meaning: 'velocity', unit: 'm/s' }
    ]
  },
  {
    name: 'Impulse',
    latex: R`\vec{J} = \vec{F}\,\Delta t = \Delta \vec{p}`,
    category: 'Momentum'
  },
  {
    name: 'Conservation of momentum',
    latex: R`m_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2`,
    category: 'Momentum'
  },

  // ---- Circular Motion ----
  {
    name: 'Centripetal acceleration',
    latex: R`a_c = \frac{v^2}{r}`,
    category: 'Circular Motion',
    variables: [
      { symbol: 'a_c', meaning: 'centripetal acceleration', unit: 'm/s²' },
      { symbol: 'v', meaning: 'speed', unit: 'm/s' },
      { symbol: 'r', meaning: 'radius', unit: 'm' }
    ]
  },
  { name: 'Centripetal force', latex: R`F_c = \frac{mv^2}{r} = m\omega^2 r`, category: 'Circular Motion' },
  { name: 'Angular velocity', latex: R`\omega = \frac{2\pi}{T} = 2\pi f`, category: 'Circular Motion' },
  { name: 'Linear–angular velocity', latex: R`v = \omega r`, category: 'Circular Motion' },

  // ---- Rotation ----
  {
    name: 'Torque',
    latex: R`\tau = rF\sin\theta`,
    category: 'Rotation',
    variables: [
      { symbol: '\\tau', meaning: 'torque', unit: 'N·m' },
      { symbol: 'r', meaning: 'lever arm', unit: 'm' },
      { symbol: 'F', meaning: 'force', unit: 'N' }
    ]
  },
  { name: 'Rotational Newton II', latex: R`\tau = I\alpha`, category: 'Rotation' },
  { name: 'Angular momentum', latex: R`L = I\omega`, category: 'Rotation' },
  { name: 'Rotational kinetic energy', latex: R`E_k = \tfrac{1}{2}I\omega^2`, category: 'Rotation' },
  { name: 'Moment of inertia', latex: R`I = \sum m_i r_i^2`, category: 'Rotation' },

  // ---- Gravitation ----
  {
    name: 'Newton law of gravitation',
    latex: R`F = \frac{G m_1 m_2}{r^2}`,
    category: 'Gravitation',
    variables: [
      { symbol: 'G', meaning: 'gravitational constant', unit: 'N·m²/kg²' },
      { symbol: 'm_1, m_2', meaning: 'masses', unit: 'kg' },
      { symbol: 'r', meaning: 'separation', unit: 'm' }
    ]
  },
  { name: 'Gravitational field strength', latex: R`g = \frac{GM}{r^2}`, category: 'Gravitation' },
  { name: 'Gravitational potential energy (general)', latex: R`U = -\frac{G m_1 m_2}{r}`, category: 'Gravitation' },
  { name: 'Orbital speed', latex: R`v = \sqrt{\frac{GM}{r}}`, category: 'Gravitation' },
  { name: 'Escape velocity', latex: R`v_e = \sqrt{\frac{2GM}{r}}`, category: 'Gravitation' },
  { name: "Kepler's third law", latex: R`T^2 = \frac{4\pi^2}{GM}r^3`, category: 'Gravitation' },

  // ---- Oscillations (SHM) ----
  {
    name: 'SHM displacement',
    latex: R`x(t) = A\cos(\omega t + \varphi)`,
    category: 'Oscillations',
    variables: [
      { symbol: 'A', meaning: 'amplitude', unit: 'm' },
      { symbol: '\\omega', meaning: 'angular frequency', unit: 'rad/s' },
      { symbol: '\\varphi', meaning: 'phase constant', unit: 'rad' }
    ]
  },
  { name: 'Period of a spring', latex: R`T = 2\pi\sqrt{\frac{m}{k}}`, category: 'Oscillations' },
  { name: 'Period of a simple pendulum', latex: R`T = 2\pi\sqrt{\frac{L}{g}}`, category: 'Oscillations' },
  { name: 'Frequency', latex: R`f = \frac{1}{T}`, category: 'Oscillations' },

  // ---- Waves ----
  {
    name: 'Wave speed',
    latex: R`v = f\lambda`,
    category: 'Waves',
    variables: [
      { symbol: 'v', meaning: 'wave speed', unit: 'm/s' },
      { symbol: 'f', meaning: 'frequency', unit: 'Hz' },
      { symbol: '\\lambda', meaning: 'wavelength', unit: 'm' }
    ]
  },
  { name: 'Speed of a wave on a string', latex: R`v = \sqrt{\frac{T}{\mu}}`, category: 'Waves' },
  { name: 'Doppler effect', latex: R`f' = f\,\frac{v \pm v_o}{v \mp v_s}`, category: 'Waves' },
  { name: 'Beat frequency', latex: R`f_\text{beat} = |f_1 - f_2|`, category: 'Waves' },

  // ---- Fluids ----
  {
    name: 'Hydrostatic pressure',
    latex: R`P = \rho g h`,
    category: 'Fluids',
    variables: [
      { symbol: 'P', meaning: 'pressure', unit: 'Pa' },
      { symbol: '\\rho', meaning: 'density', unit: 'kg/m³' },
      { symbol: 'h', meaning: 'depth', unit: 'm' }
    ]
  },
  { name: 'Pressure', latex: R`P = \frac{F}{A}`, category: 'Fluids' },
  { name: 'Buoyant force (Archimedes)', latex: R`F_b = \rho V g`, category: 'Fluids' },
  { name: 'Continuity equation', latex: R`A_1 v_1 = A_2 v_2`, category: 'Fluids' },
  {
    name: 'Bernoulli equation',
    latex: R`P + \tfrac{1}{2}\rho v^2 + \rho g h = \text{const}`,
    category: 'Fluids'
  },

  // ---- Thermodynamics ----
  {
    name: 'Ideal gas law',
    latex: R`PV = nRT`,
    category: 'Thermodynamics',
    variables: [
      { symbol: 'P', meaning: 'pressure', unit: 'Pa' },
      { symbol: 'V', meaning: 'volume', unit: 'm³' },
      { symbol: 'n', meaning: 'amount', unit: 'mol' },
      { symbol: 'T', meaning: 'temperature', unit: 'K' }
    ]
  },
  { name: 'Heat (temperature change)', latex: R`Q = mc\,\Delta T`, category: 'Thermodynamics' },
  { name: 'Latent heat', latex: R`Q = mL`, category: 'Thermodynamics' },
  { name: 'First law of thermodynamics', latex: R`\Delta U = Q - W`, category: 'Thermodynamics' },
  { name: 'Carnot efficiency', latex: R`\eta = 1 - \frac{T_c}{T_h}`, category: 'Thermodynamics' },
  { name: 'Linear thermal expansion', latex: R`\Delta L = \alpha L_0 \Delta T`, category: 'Thermodynamics' },

  // ---- Electrostatics ----
  {
    name: "Coulomb's law",
    latex: R`F = k\frac{q_1 q_2}{r^2}`,
    category: 'Electrostatics',
    variables: [
      { symbol: 'k', meaning: 'Coulomb constant', unit: 'N·m²/C²' },
      { symbol: 'q_1, q_2', meaning: 'charges', unit: 'C' },
      { symbol: 'r', meaning: 'separation', unit: 'm' }
    ]
  },
  { name: 'Electric field', latex: R`E = \frac{F}{q}`, category: 'Electrostatics' },
  { name: 'Field of a point charge', latex: R`E = k\frac{Q}{r^2}`, category: 'Electrostatics' },
  { name: 'Electric potential', latex: R`V = k\frac{Q}{r}`, category: 'Electrostatics' },
  { name: 'Uniform field', latex: R`E = \frac{V}{d}`, category: 'Electrostatics' },
  { name: 'Capacitance', latex: R`C = \frac{Q}{V}`, category: 'Electrostatics' },
  { name: 'Energy stored in a capacitor', latex: R`U = \tfrac{1}{2}CV^2`, category: 'Electrostatics' },

  // ---- Circuits ----
  {
    name: "Ohm's law",
    latex: R`V = IR`,
    category: 'Circuits',
    variables: [
      { symbol: 'V', meaning: 'voltage', unit: 'V' },
      { symbol: 'I', meaning: 'current', unit: 'A' },
      { symbol: 'R', meaning: 'resistance', unit: 'Ω' }
    ]
  },
  { name: 'Electrical power', latex: R`P = IV = I^2 R = \frac{V^2}{R}`, category: 'Circuits' },
  { name: 'Resistors in series', latex: R`R_s = R_1 + R_2 + \cdots`, category: 'Circuits' },
  { name: 'Resistors in parallel', latex: R`\frac{1}{R_p} = \frac{1}{R_1} + \frac{1}{R_2} + \cdots`, category: 'Circuits' },
  { name: 'Charge', latex: R`Q = It`, category: 'Circuits' },
  { name: 'RC time constant', latex: R`\tau = RC`, category: 'Circuits' },

  // ---- Magnetism ----
  {
    name: 'Magnetic force on a charge',
    latex: R`F = qvB\sin\theta`,
    category: 'Magnetism',
    variables: [
      { symbol: 'q', meaning: 'charge', unit: 'C' },
      { symbol: 'v', meaning: 'speed', unit: 'm/s' },
      { symbol: 'B', meaning: 'magnetic flux density', unit: 'T' }
    ]
  },
  { name: 'Force on a current-carrying wire', latex: R`F = BIL\sin\theta`, category: 'Magnetism' },
  { name: 'Field around a long wire', latex: R`B = \frac{\mu_0 I}{2\pi r}`, category: 'Magnetism' },
  { name: 'Field inside a solenoid', latex: R`B = \mu_0 n I`, category: 'Magnetism' },
  { name: 'Magnetic flux', latex: R`\Phi = BA\cos\theta`, category: 'Magnetism' },

  // ---- Electromagnetic Induction ----
  {
    name: "Faraday's law",
    latex: R`\varepsilon = -N\frac{d\Phi}{dt}`,
    category: 'Induction',
    variables: [
      { symbol: '\\varepsilon', meaning: 'induced emf', unit: 'V' },
      { symbol: 'N', meaning: 'number of turns' },
      { symbol: '\\Phi', meaning: 'magnetic flux', unit: 'Wb' }
    ]
  },
  { name: 'Motional emf', latex: R`\varepsilon = BLv`, category: 'Induction' },
  { name: 'Transformer equation', latex: R`\frac{V_s}{V_p} = \frac{N_s}{N_p}`, category: 'Induction' },

  // ---- Optics ----
  {
    name: 'Thin lens equation',
    latex: R`\frac{1}{f} = \frac{1}{d_o} + \frac{1}{d_i}`,
    category: 'Optics',
    variables: [
      { symbol: 'f', meaning: 'focal length', unit: 'm' },
      { symbol: 'd_o', meaning: 'object distance', unit: 'm' },
      { symbol: 'd_i', meaning: 'image distance', unit: 'm' }
    ]
  },
  { name: 'Magnification', latex: R`m = -\frac{d_i}{d_o}`, category: 'Optics' },
  { name: 'Refractive index', latex: R`n = \frac{c}{v}`, category: 'Optics' },
  { name: "Snell's law", latex: R`n_1 \sin\theta_1 = n_2 \sin\theta_2`, category: 'Optics' },
  { name: 'Diffraction grating', latex: R`d\sin\theta = m\lambda`, category: 'Optics' },

  // ---- Modern & Quantum ----
  {
    name: 'Photon energy',
    latex: R`E = hf = \frac{hc}{\lambda}`,
    category: 'Modern Physics',
    variables: [
      { symbol: 'h', meaning: 'Planck constant', unit: 'J·s' },
      { symbol: 'f', meaning: 'frequency', unit: 'Hz' },
      { symbol: '\\lambda', meaning: 'wavelength', unit: 'm' }
    ]
  },
  { name: 'de Broglie wavelength', latex: R`\lambda = \frac{h}{p}`, category: 'Modern Physics' },
  { name: 'Photoelectric effect', latex: R`E_{k,\max} = hf - \phi`, category: 'Modern Physics' },
  { name: 'Hydrogen energy levels', latex: R`E_n = -\frac{13.6\ \text{eV}}{n^2}`, category: 'Modern Physics' },
  { name: 'Heisenberg uncertainty', latex: R`\Delta x\,\Delta p \geq \frac{\hbar}{2}`, category: 'Modern Physics' },

  // ---- Relativity ----
  {
    name: 'Mass–energy equivalence',
    latex: R`E = mc^2`,
    category: 'Relativity',
    variables: [
      { symbol: 'E', meaning: 'energy', unit: 'J' },
      { symbol: 'm', meaning: 'mass', unit: 'kg' },
      { symbol: 'c', meaning: 'speed of light', unit: 'm/s' }
    ]
  },
  { name: 'Relativistic energy–momentum', latex: R`E^2 = (pc)^2 + (mc^2)^2`, category: 'Relativity' },
  { name: 'Lorentz factor', latex: R`\gamma = \frac{1}{\sqrt{1 - v^2/c^2}}`, category: 'Relativity' },
  { name: 'Time dilation', latex: R`\Delta t = \gamma\,\Delta t_0`, category: 'Relativity' },
  { name: 'Length contraction', latex: R`L = \frac{L_0}{\gamma}`, category: 'Relativity' }
]

/** Inserts the built-in equation set once (when no built-ins exist yet). */
export function seedEquationsIfEmpty(): void {
  const db = getDb()
  const count = db.prepare(`SELECT COUNT(*) AS c FROM equations WHERE is_builtin = 1`).get() as {
    c: number
  }
  if (count.c > 0) return

  const ts = Date.now()
  const insert = db.prepare(
    `INSERT INTO equations
       (name, latex, description, category, variables_json, tags, is_builtin, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
  )
  const tx = db.transaction(() => {
    for (const s of SEEDS) {
      insert.run(
        s.name,
        s.latex,
        s.description ?? '',
        s.category,
        JSON.stringify(s.variables ?? []),
        (s.tags ?? []).join(','),
        ts,
        ts
      )
    }
  })
  tx()
}
