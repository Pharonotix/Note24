import type { EquationVariable } from '@shared/types'
import { getDb } from './database'

interface Seed {
  name: string
  latex: string
  category: string
  description: string
  variables: EquationVariable[]
  tags?: string[]
}

const R = String.raw

/**
 * Built-in equation library, seeded on first run. Every entry has a plain-
 * language description and a complete variable list (every symbol used in
 * its LaTeX) — the same fields required of any custom equation a user adds.
 */
const SEEDS: Seed[] = [
  // ============================= PHYSICS =============================

  // ---- Kinematics ----
  {
    name: 'Velocity (constant acceleration)',
    latex: R`v = u + at`,
    category: 'Kinematics',
    description: 'Final velocity after accelerating at a constant rate for a time t, starting from initial velocity u.',
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
    description: 'Displacement after time t under constant acceleration a, starting at velocity u.',
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
    description: 'Relates velocity to displacement under constant acceleration, without needing time.',
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
    category: 'Kinematics',
    description: 'Displacement equals the average of initial and final velocity, multiplied by time.',
    variables: [
      { symbol: 's', meaning: 'displacement', unit: 'm' },
      { symbol: 'u', meaning: 'initial velocity', unit: 'm/s' },
      { symbol: 'v', meaning: 'final velocity', unit: 'm/s' },
      { symbol: 't', meaning: 'time', unit: 's' }
    ]
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
    category: 'Dynamics',
    description: 'The general form of Newton’s second law: net force equals the rate of change of momentum.',
    variables: [
      { symbol: 'F', meaning: 'net force', unit: 'N' },
      { symbol: 'p', meaning: 'momentum', unit: 'kg·m/s' },
      { symbol: 't', meaning: 'time', unit: 's' }
    ]
  },
  {
    name: 'Weight',
    latex: R`W = mg`,
    category: 'Dynamics',
    description: 'The gravitational force on a mass near a planet’s surface.',
    variables: [
      { symbol: 'W', meaning: 'weight', unit: 'N' },
      { symbol: 'm', meaning: 'mass', unit: 'kg' },
      { symbol: 'g', meaning: 'gravitational field strength', unit: 'm/s²' }
    ]
  },
  {
    name: 'Friction force',
    latex: R`f = \mu N`,
    category: 'Dynamics',
    description: 'Friction force is proportional to the normal force, scaled by the coefficient of friction.',
    variables: [
      { symbol: 'f', meaning: 'friction force', unit: 'N' },
      { symbol: '\\mu', meaning: 'coefficient of friction', unit: 'dimensionless' },
      { symbol: 'N', meaning: 'normal force', unit: 'N' }
    ]
  },

  // ---- Work & Energy ----
  {
    name: 'Work',
    latex: R`W = Fd\cos\theta`,
    category: 'Work & Energy',
    description: 'Work done by a constant force moving an object through a displacement d.',
    variables: [
      { symbol: 'W', meaning: 'work', unit: 'J' },
      { symbol: 'F', meaning: 'force', unit: 'N' },
      { symbol: 'd', meaning: 'displacement', unit: 'm' },
      { symbol: '\\theta', meaning: 'angle between force and displacement', unit: 'degrees or rad' }
    ]
  },
  {
    name: 'Kinetic energy',
    latex: R`E_k = \tfrac{1}{2}mv^2`,
    category: 'Work & Energy',
    description: 'Energy of motion, proportional to mass and the square of speed.',
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
    description: 'Energy stored due to height above a reference level in a gravitational field.',
    variables: [
      { symbol: 'E_p', meaning: 'gravitational potential energy', unit: 'J' },
      { symbol: 'm', meaning: 'mass', unit: 'kg' },
      { symbol: 'g', meaning: 'gravitational field strength', unit: 'm/s²' },
      { symbol: 'h', meaning: 'height', unit: 'm' }
    ]
  },
  {
    name: 'Elastic potential energy',
    latex: R`E = \tfrac{1}{2}kx^2`,
    category: 'Work & Energy',
    description: 'Energy stored in a stretched or compressed spring.',
    variables: [
      { symbol: 'E', meaning: 'elastic potential energy', unit: 'J' },
      { symbol: 'k', meaning: 'spring constant', unit: 'N/m' },
      { symbol: 'x', meaning: 'extension or compression', unit: 'm' }
    ]
  },
  {
    name: 'Power (work)',
    latex: R`P = \frac{W}{t}`,
    category: 'Work & Energy',
    description: 'Rate at which work is done.',
    variables: [
      { symbol: 'P', meaning: 'power', unit: 'W' },
      { symbol: 'W', meaning: 'work done', unit: 'J' },
      { symbol: 't', meaning: 'time', unit: 's' }
    ]
  },
  {
    name: 'Power (force × velocity)',
    latex: R`P = Fv`,
    category: 'Work & Energy',
    description: 'Instantaneous power delivered by a force acting on an object moving at velocity v.',
    variables: [
      { symbol: 'P', meaning: 'power', unit: 'W' },
      { symbol: 'F', meaning: 'force', unit: 'N' },
      { symbol: 'v', meaning: 'velocity', unit: 'm/s' }
    ]
  },

  // ---- Momentum ----
  {
    name: 'Momentum',
    latex: R`\vec{p} = m\vec{v}`,
    category: 'Momentum',
    description: 'The product of mass and velocity — a vector quantity conserved in isolated systems.',
    variables: [
      { symbol: 'p', meaning: 'momentum', unit: 'kg·m/s' },
      { symbol: 'm', meaning: 'mass', unit: 'kg' },
      { symbol: 'v', meaning: 'velocity', unit: 'm/s' }
    ]
  },
  {
    name: 'Impulse',
    latex: R`\vec{J} = \vec{F}\,\Delta t = \Delta \vec{p}`,
    category: 'Momentum',
    description: 'A net force applied over a time interval produces a change in momentum.',
    variables: [
      { symbol: 'J', meaning: 'impulse', unit: 'N·s' },
      { symbol: 'F', meaning: 'net force', unit: 'N' },
      { symbol: '\\Delta t', meaning: 'time interval', unit: 's' },
      { symbol: '\\Delta p', meaning: 'change in momentum', unit: 'kg·m/s' }
    ]
  },
  {
    name: 'Conservation of momentum',
    latex: R`m_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2`,
    category: 'Momentum',
    description: 'Total momentum before a collision equals total momentum after, when no external force acts.',
    variables: [
      { symbol: 'm_1, m_2', meaning: 'masses of the two objects', unit: 'kg' },
      { symbol: 'u_1, u_2', meaning: 'initial velocities', unit: 'm/s' },
      { symbol: 'v_1, v_2', meaning: 'final velocities', unit: 'm/s' }
    ]
  },

  // ---- Circular Motion ----
  {
    name: 'Centripetal acceleration',
    latex: R`a_c = \frac{v^2}{r}`,
    category: 'Circular Motion',
    description: 'Acceleration directed toward the center of a circular path, caused by continuously changing direction of velocity.',
    variables: [
      { symbol: 'a_c', meaning: 'centripetal acceleration', unit: 'm/s²' },
      { symbol: 'v', meaning: 'speed', unit: 'm/s' },
      { symbol: 'r', meaning: 'radius of the circular path', unit: 'm' }
    ]
  },
  {
    name: 'Centripetal force',
    latex: R`F_c = \frac{mv^2}{r} = m\omega^2 r`,
    category: 'Circular Motion',
    description: 'Net force required to keep an object moving along a circular path.',
    variables: [
      { symbol: 'F_c', meaning: 'centripetal force', unit: 'N' },
      { symbol: 'm', meaning: 'mass', unit: 'kg' },
      { symbol: 'v', meaning: 'speed', unit: 'm/s' },
      { symbol: 'r', meaning: 'radius', unit: 'm' },
      { symbol: '\\omega', meaning: 'angular velocity', unit: 'rad/s' }
    ]
  },
  {
    name: 'Angular velocity',
    latex: R`\omega = \frac{2\pi}{T} = 2\pi f`,
    category: 'Circular Motion',
    description: 'Rate of rotation, related to the period or frequency of revolution.',
    variables: [
      { symbol: '\\omega', meaning: 'angular velocity', unit: 'rad/s' },
      { symbol: 'T', meaning: 'period of revolution', unit: 's' },
      { symbol: 'f', meaning: 'frequency', unit: 'Hz' }
    ]
  },
  {
    name: 'Linear–angular velocity',
    latex: R`v = \omega r`,
    category: 'Circular Motion',
    description: 'Relates the tangential (linear) speed of a point to its angular velocity and distance from the axis.',
    variables: [
      { symbol: 'v', meaning: 'tangential speed', unit: 'm/s' },
      { symbol: '\\omega', meaning: 'angular velocity', unit: 'rad/s' },
      { symbol: 'r', meaning: 'distance from the rotation axis', unit: 'm' }
    ]
  },

  // ---- Rotation ----
  {
    name: 'Torque',
    latex: R`\tau = rF\sin\theta`,
    category: 'Rotation',
    description: 'The rotational analogue of force, produced by a force applied at a distance from a pivot.',
    variables: [
      { symbol: '\\tau', meaning: 'torque', unit: 'N·m' },
      { symbol: 'r', meaning: 'lever arm (distance from pivot)', unit: 'm' },
      { symbol: 'F', meaning: 'applied force', unit: 'N' },
      { symbol: '\\theta', meaning: 'angle between r and F', unit: 'degrees or rad' }
    ]
  },
  {
    name: 'Rotational Newton II',
    latex: R`\tau = I\alpha`,
    category: 'Rotation',
    description: 'The rotational analogue of F = ma: net torque equals moment of inertia times angular acceleration.',
    variables: [
      { symbol: '\\tau', meaning: 'net torque', unit: 'N·m' },
      { symbol: 'I', meaning: 'moment of inertia', unit: 'kg·m²' },
      { symbol: '\\alpha', meaning: 'angular acceleration', unit: 'rad/s²' }
    ]
  },
  {
    name: 'Angular momentum',
    latex: R`L = I\omega`,
    category: 'Rotation',
    description: 'The rotational analogue of momentum, conserved when no external torque acts.',
    variables: [
      { symbol: 'L', meaning: 'angular momentum', unit: 'kg·m²/s' },
      { symbol: 'I', meaning: 'moment of inertia', unit: 'kg·m²' },
      { symbol: '\\omega', meaning: 'angular velocity', unit: 'rad/s' }
    ]
  },
  {
    name: 'Rotational kinetic energy',
    latex: R`E_k = \tfrac{1}{2}I\omega^2`,
    category: 'Rotation',
    description: 'Kinetic energy of a rotating rigid body.',
    variables: [
      { symbol: 'E_k', meaning: 'rotational kinetic energy', unit: 'J' },
      { symbol: 'I', meaning: 'moment of inertia', unit: 'kg·m²' },
      { symbol: '\\omega', meaning: 'angular velocity', unit: 'rad/s' }
    ]
  },
  {
    name: 'Moment of inertia',
    latex: R`I = \sum m_i r_i^2`,
    category: 'Rotation',
    description: 'A measure of a rigid body’s resistance to angular acceleration, built up from the mass and distance-from-axis of every particle in it.',
    variables: [
      { symbol: 'I', meaning: 'moment of inertia', unit: 'kg·m²' },
      { symbol: 'm_i', meaning: 'mass of the i-th particle', unit: 'kg' },
      { symbol: 'r_i', meaning: 'distance of the i-th particle from the axis', unit: 'm' }
    ]
  },

  // ---- Gravitation ----
  {
    name: 'Newton law of gravitation',
    latex: R`F = \frac{G m_1 m_2}{r^2}`,
    category: 'Gravitation',
    description: 'Every pair of masses attracts with a force proportional to their masses and inversely proportional to the square of their separation.',
    variables: [
      { symbol: 'F', meaning: 'gravitational force', unit: 'N' },
      { symbol: 'G', meaning: 'gravitational constant', unit: 'N·m²/kg²' },
      { symbol: 'm_1, m_2', meaning: 'the two masses', unit: 'kg' },
      { symbol: 'r', meaning: 'separation between the masses', unit: 'm' }
    ]
  },
  {
    name: 'Gravitational field strength',
    latex: R`g = \frac{GM}{r^2}`,
    category: 'Gravitation',
    description: 'The gravitational force per unit mass at a distance r from a mass M.',
    variables: [
      { symbol: 'g', meaning: 'gravitational field strength', unit: 'm/s²' },
      { symbol: 'G', meaning: 'gravitational constant', unit: 'N·m²/kg²' },
      { symbol: 'M', meaning: 'mass of the source body', unit: 'kg' },
      { symbol: 'r', meaning: 'distance from the center of the mass', unit: 'm' }
    ]
  },
  {
    name: 'Gravitational potential energy (general)',
    latex: R`U = -\frac{G m_1 m_2}{r}`,
    category: 'Gravitation',
    description: 'Potential energy of two masses due to their mutual gravitational attraction, taken as zero at infinite separation.',
    variables: [
      { symbol: 'U', meaning: 'gravitational potential energy', unit: 'J' },
      { symbol: 'G', meaning: 'gravitational constant', unit: 'N·m²/kg²' },
      { symbol: 'm_1, m_2', meaning: 'the two masses', unit: 'kg' },
      { symbol: 'r', meaning: 'separation between the masses', unit: 'm' }
    ]
  },
  {
    name: 'Orbital speed',
    latex: R`v = \sqrt{\frac{GM}{r}}`,
    category: 'Gravitation',
    description: 'Speed needed to maintain a stable circular orbit at radius r around mass M.',
    variables: [
      { symbol: 'v', meaning: 'orbital speed', unit: 'm/s' },
      { symbol: 'G', meaning: 'gravitational constant', unit: 'N·m²/kg²' },
      { symbol: 'M', meaning: 'mass being orbited', unit: 'kg' },
      { symbol: 'r', meaning: 'orbital radius', unit: 'm' }
    ]
  },
  {
    name: 'Escape velocity',
    latex: R`v_e = \sqrt{\frac{2GM}{r}}`,
    category: 'Gravitation',
    description: 'Minimum speed needed to escape a gravitational field permanently, starting from radius r.',
    variables: [
      { symbol: 'v_e', meaning: 'escape velocity', unit: 'm/s' },
      { symbol: 'G', meaning: 'gravitational constant', unit: 'N·m²/kg²' },
      { symbol: 'M', meaning: 'mass being escaped from', unit: 'kg' },
      { symbol: 'r', meaning: 'starting distance from the center', unit: 'm' }
    ]
  },
  {
    name: "Kepler's third law",
    latex: R`T^2 = \frac{4\pi^2}{GM}r^3`,
    category: 'Gravitation',
    description: 'The square of an orbital period is proportional to the cube of the orbit’s radius.',
    variables: [
      { symbol: 'T', meaning: 'orbital period', unit: 's' },
      { symbol: 'G', meaning: 'gravitational constant', unit: 'N·m²/kg²' },
      { symbol: 'M', meaning: 'mass being orbited', unit: 'kg' },
      { symbol: 'r', meaning: 'orbital radius', unit: 'm' }
    ]
  },

  // ---- Oscillations (SHM) ----
  {
    name: 'SHM displacement',
    latex: R`x(t) = A\cos(\omega t + \varphi)`,
    category: 'Oscillations',
    description: 'Position of an object undergoing simple harmonic motion as a function of time.',
    variables: [
      { symbol: 'x(t)', meaning: 'displacement at time t', unit: 'm' },
      { symbol: 'A', meaning: 'amplitude', unit: 'm' },
      { symbol: '\\omega', meaning: 'angular frequency', unit: 'rad/s' },
      { symbol: 't', meaning: 'time', unit: 's' },
      { symbol: '\\varphi', meaning: 'phase constant', unit: 'rad' }
    ]
  },
  {
    name: 'Period of a spring',
    latex: R`T = 2\pi\sqrt{\frac{m}{k}}`,
    category: 'Oscillations',
    description: 'Period of oscillation for a mass on a spring, independent of amplitude.',
    variables: [
      { symbol: 'T', meaning: 'period', unit: 's' },
      { symbol: 'm', meaning: 'mass', unit: 'kg' },
      { symbol: 'k', meaning: 'spring constant', unit: 'N/m' }
    ]
  },
  {
    name: 'Period of a simple pendulum',
    latex: R`T = 2\pi\sqrt{\frac{L}{g}}`,
    category: 'Oscillations',
    description: 'Period of a simple pendulum for small swing angles.',
    variables: [
      { symbol: 'T', meaning: 'period', unit: 's' },
      { symbol: 'L', meaning: 'pendulum length', unit: 'm' },
      { symbol: 'g', meaning: 'gravitational field strength', unit: 'm/s²' }
    ]
  },
  {
    name: 'Frequency',
    latex: R`f = \frac{1}{T}`,
    category: 'Oscillations',
    description: 'Number of oscillations per second — the reciprocal of the period.',
    variables: [
      { symbol: 'f', meaning: 'frequency', unit: 'Hz' },
      { symbol: 'T', meaning: 'period', unit: 's' }
    ]
  },

  // ---- Waves ----
  {
    name: 'Wave speed',
    latex: R`v = f\lambda`,
    category: 'Waves',
    description: 'Speed at which a wave propagates, equal to frequency times wavelength.',
    variables: [
      { symbol: 'v', meaning: 'wave speed', unit: 'm/s' },
      { symbol: 'f', meaning: 'frequency', unit: 'Hz' },
      { symbol: '\\lambda', meaning: 'wavelength', unit: 'm' }
    ]
  },
  {
    name: 'Speed of a wave on a string',
    latex: R`v = \sqrt{\frac{T}{\mu}}`,
    category: 'Waves',
    description: 'Speed of a transverse wave traveling along a stretched string.',
    variables: [
      { symbol: 'v', meaning: 'wave speed', unit: 'm/s' },
      { symbol: 'T', meaning: 'string tension', unit: 'N' },
      { symbol: '\\mu', meaning: 'linear mass density', unit: 'kg/m' }
    ]
  },
  {
    name: 'Doppler effect',
    latex: R`f' = f\,\frac{v \pm v_o}{v \mp v_s}`,
    category: 'Waves',
    description: 'Shift in observed frequency due to relative motion between a wave source and an observer.',
    variables: [
      { symbol: "f'", meaning: 'observed frequency', unit: 'Hz' },
      { symbol: 'f', meaning: 'source (emitted) frequency', unit: 'Hz' },
      { symbol: 'v', meaning: 'speed of the wave in the medium', unit: 'm/s' },
      { symbol: 'v_o', meaning: 'observer speed', unit: 'm/s' },
      { symbol: 'v_s', meaning: 'source speed', unit: 'm/s' }
    ]
  },
  {
    name: 'Beat frequency',
    latex: R`f_\text{beat} = |f_1 - f_2|`,
    category: 'Waves',
    description: 'The frequency of the amplitude “beating” heard when two close frequencies are superimposed.',
    variables: [
      { symbol: 'f_{beat}', meaning: 'beat frequency', unit: 'Hz' },
      { symbol: 'f_1, f_2', meaning: 'the two source frequencies', unit: 'Hz' }
    ]
  },

  // ---- Fluids ----
  {
    name: 'Hydrostatic pressure',
    latex: R`P = \rho g h`,
    category: 'Fluids',
    description: 'Pressure increase with depth in a static fluid, due to the weight of fluid above.',
    variables: [
      { symbol: 'P', meaning: 'pressure', unit: 'Pa' },
      { symbol: '\\rho', meaning: 'fluid density', unit: 'kg/m³' },
      { symbol: 'g', meaning: 'gravitational field strength', unit: 'm/s²' },
      { symbol: 'h', meaning: 'depth', unit: 'm' }
    ]
  },
  {
    name: 'Pressure',
    latex: R`P = \frac{F}{A}`,
    category: 'Fluids',
    description: 'Force distributed over an area.',
    variables: [
      { symbol: 'P', meaning: 'pressure', unit: 'Pa' },
      { symbol: 'F', meaning: 'force', unit: 'N' },
      { symbol: 'A', meaning: 'area', unit: 'm²' }
    ]
  },
  {
    name: 'Buoyant force (Archimedes)',
    latex: R`F_b = \rho V g`,
    category: 'Fluids',
    description: 'The upward buoyant force on an object equals the weight of fluid it displaces.',
    variables: [
      { symbol: 'F_b', meaning: 'buoyant force', unit: 'N' },
      { symbol: '\\rho', meaning: 'fluid density', unit: 'kg/m³' },
      { symbol: 'V', meaning: 'displaced volume', unit: 'm³' },
      { symbol: 'g', meaning: 'gravitational field strength', unit: 'm/s²' }
    ]
  },
  {
    name: 'Continuity equation',
    latex: R`A_1 v_1 = A_2 v_2`,
    category: 'Fluids',
    description: 'For incompressible flow, the volume flow rate is the same at every cross-section of a pipe.',
    variables: [
      { symbol: 'A_1, A_2', meaning: 'cross-sectional areas at two points', unit: 'm²' },
      { symbol: 'v_1, v_2', meaning: 'flow speeds at those points', unit: 'm/s' }
    ]
  },
  {
    name: 'Bernoulli equation',
    latex: R`P + \tfrac{1}{2}\rho v^2 + \rho g h = \text{const}`,
    category: 'Fluids',
    description: 'Along a streamline, the sum of pressure, kinetic, and potential energy per unit volume stays constant.',
    variables: [
      { symbol: 'P', meaning: 'pressure', unit: 'Pa' },
      { symbol: '\\rho', meaning: 'fluid density', unit: 'kg/m³' },
      { symbol: 'v', meaning: 'flow speed', unit: 'm/s' },
      { symbol: 'g', meaning: 'gravitational field strength', unit: 'm/s²' },
      { symbol: 'h', meaning: 'height', unit: 'm' }
    ]
  },

  // ---- Thermodynamics ----
  {
    name: 'Ideal gas law',
    latex: R`PV = nRT`,
    category: 'Thermodynamics',
    description: 'Relates pressure, volume, amount, and temperature of an ideal gas.',
    variables: [
      { symbol: 'P', meaning: 'pressure', unit: 'Pa' },
      { symbol: 'V', meaning: 'volume', unit: 'm³' },
      { symbol: 'n', meaning: 'amount of gas', unit: 'mol' },
      { symbol: 'R', meaning: 'ideal gas constant', unit: 'J/(mol·K)' },
      { symbol: 'T', meaning: 'temperature', unit: 'K' }
    ]
  },
  {
    name: 'Heat (temperature change)',
    latex: R`Q = mc\,\Delta T`,
    category: 'Thermodynamics',
    description: 'Heat required to change the temperature of a mass by ΔT.',
    variables: [
      { symbol: 'Q', meaning: 'heat energy', unit: 'J' },
      { symbol: 'm', meaning: 'mass', unit: 'kg' },
      { symbol: 'c', meaning: 'specific heat capacity', unit: 'J/(kg·K)' },
      { symbol: '\\Delta T', meaning: 'temperature change', unit: 'K' }
    ]
  },
  {
    name: 'Latent heat',
    latex: R`Q = mL`,
    category: 'Thermodynamics',
    description: 'Heat required for a phase change (e.g. melting or boiling) at constant temperature.',
    variables: [
      { symbol: 'Q', meaning: 'heat energy', unit: 'J' },
      { symbol: 'm', meaning: 'mass', unit: 'kg' },
      { symbol: 'L', meaning: 'specific latent heat', unit: 'J/kg' }
    ]
  },
  {
    name: 'First law of thermodynamics',
    latex: R`\Delta U = Q - W`,
    category: 'Thermodynamics',
    description: 'Energy conservation for a thermodynamic system: internal energy changes by heat added minus work done by the system.',
    variables: [
      { symbol: '\\Delta U', meaning: 'change in internal energy', unit: 'J' },
      { symbol: 'Q', meaning: 'heat added to the system', unit: 'J' },
      { symbol: 'W', meaning: 'work done by the system', unit: 'J' }
    ]
  },
  {
    name: 'Carnot efficiency',
    latex: R`\eta = 1 - \frac{T_c}{T_h}`,
    category: 'Thermodynamics',
    description: 'Maximum possible efficiency of a heat engine operating between two temperatures.',
    variables: [
      { symbol: '\\eta', meaning: 'efficiency', unit: 'dimensionless (0–1)' },
      { symbol: 'T_c', meaning: 'cold reservoir temperature', unit: 'K' },
      { symbol: 'T_h', meaning: 'hot reservoir temperature', unit: 'K' }
    ]
  },
  {
    name: 'Linear thermal expansion',
    latex: R`\Delta L = \alpha L_0 \Delta T`,
    category: 'Thermodynamics',
    description: 'Change in length of a material due to a temperature change.',
    variables: [
      { symbol: '\\Delta L', meaning: 'change in length', unit: 'm' },
      { symbol: '\\alpha', meaning: 'coefficient of linear expansion', unit: '1/K' },
      { symbol: 'L_0', meaning: 'original length', unit: 'm' },
      { symbol: '\\Delta T', meaning: 'temperature change', unit: 'K' }
    ]
  },

  // ---- Electrostatics ----
  {
    name: "Coulomb's law",
    latex: R`F = k\frac{q_1 q_2}{r^2}`,
    category: 'Electrostatics',
    description: 'The electrostatic force between two point charges, proportional to their product and inversely proportional to the square of their separation.',
    variables: [
      { symbol: 'F', meaning: 'electrostatic force', unit: 'N' },
      { symbol: 'k', meaning: 'Coulomb constant', unit: 'N·m²/C²' },
      { symbol: 'q_1, q_2', meaning: 'the two point charges', unit: 'C' },
      { symbol: 'r', meaning: 'separation between charges', unit: 'm' }
    ]
  },
  {
    name: 'Electric field',
    latex: R`E = \frac{F}{q}`,
    category: 'Electrostatics',
    description: 'Electric field is the force per unit positive charge at a point.',
    variables: [
      { symbol: 'E', meaning: 'electric field strength', unit: 'N/C' },
      { symbol: 'F', meaning: 'force on the test charge', unit: 'N' },
      { symbol: 'q', meaning: 'test charge', unit: 'C' }
    ]
  },
  {
    name: 'Field of a point charge',
    latex: R`E = k\frac{Q}{r^2}`,
    category: 'Electrostatics',
    description: 'Electric field strength at a distance r from a point charge Q.',
    variables: [
      { symbol: 'E', meaning: 'electric field strength', unit: 'N/C' },
      { symbol: 'k', meaning: 'Coulomb constant', unit: 'N·m²/C²' },
      { symbol: 'Q', meaning: 'source charge', unit: 'C' },
      { symbol: 'r', meaning: 'distance from the charge', unit: 'm' }
    ]
  },
  {
    name: 'Electric potential',
    latex: R`V = k\frac{Q}{r}`,
    category: 'Electrostatics',
    description: 'Electric potential due to a point charge, decreasing with distance.',
    variables: [
      { symbol: 'V', meaning: 'electric potential', unit: 'V' },
      { symbol: 'k', meaning: 'Coulomb constant', unit: 'N·m²/C²' },
      { symbol: 'Q', meaning: 'source charge', unit: 'C' },
      { symbol: 'r', meaning: 'distance from the charge', unit: 'm' }
    ]
  },
  {
    name: 'Uniform field',
    latex: R`E = \frac{V}{d}`,
    category: 'Electrostatics',
    description: 'Electric field strength between two parallel plates with a potential difference V.',
    variables: [
      { symbol: 'E', meaning: 'electric field strength', unit: 'V/m' },
      { symbol: 'V', meaning: 'potential difference', unit: 'V' },
      { symbol: 'd', meaning: 'plate separation', unit: 'm' }
    ]
  },
  {
    name: 'Capacitance',
    latex: R`C = \frac{Q}{V}`,
    category: 'Electrostatics',
    description: "A capacitor's ability to store charge per unit voltage.",
    variables: [
      { symbol: 'C', meaning: 'capacitance', unit: 'F' },
      { symbol: 'Q', meaning: 'stored charge', unit: 'C' },
      { symbol: 'V', meaning: 'voltage across the capacitor', unit: 'V' }
    ]
  },
  {
    name: 'Energy stored in a capacitor',
    latex: R`U = \tfrac{1}{2}CV^2`,
    category: 'Electrostatics',
    description: 'Electrical potential energy stored in a charged capacitor.',
    variables: [
      { symbol: 'U', meaning: 'stored energy', unit: 'J' },
      { symbol: 'C', meaning: 'capacitance', unit: 'F' },
      { symbol: 'V', meaning: 'voltage across the capacitor', unit: 'V' }
    ]
  },

  // ---- Circuits ----
  {
    name: "Ohm's law",
    latex: R`V = IR`,
    category: 'Circuits',
    description: 'Voltage across a resistor is proportional to the current through it.',
    variables: [
      { symbol: 'V', meaning: 'voltage', unit: 'V' },
      { symbol: 'I', meaning: 'current', unit: 'A' },
      { symbol: 'R', meaning: 'resistance', unit: 'Ω' }
    ]
  },
  {
    name: 'Electrical power',
    latex: R`P = IV = I^2 R = \frac{V^2}{R}`,
    category: 'Circuits',
    description: 'Rate of electrical energy conversion in a circuit element.',
    variables: [
      { symbol: 'P', meaning: 'power', unit: 'W' },
      { symbol: 'I', meaning: 'current', unit: 'A' },
      { symbol: 'V', meaning: 'voltage', unit: 'V' },
      { symbol: 'R', meaning: 'resistance', unit: 'Ω' }
    ]
  },
  {
    name: 'Resistors in series',
    latex: R`R_s = R_1 + R_2 + \cdots`,
    category: 'Circuits',
    description: 'Total resistance of resistors connected end-to-end adds directly.',
    variables: [
      { symbol: 'R_s', meaning: 'total series resistance', unit: 'Ω' },
      { symbol: 'R_1, R_2, \\ldots', meaning: 'individual resistances', unit: 'Ω' }
    ]
  },
  {
    name: 'Resistors in parallel',
    latex: R`\frac{1}{R_p} = \frac{1}{R_1} + \frac{1}{R_2} + \cdots`,
    category: 'Circuits',
    description: 'Total resistance of resistors connected side-by-side is less than any individual resistor.',
    variables: [
      { symbol: 'R_p', meaning: 'total parallel resistance', unit: 'Ω' },
      { symbol: 'R_1, R_2, \\ldots', meaning: 'individual resistances', unit: 'Ω' }
    ]
  },
  {
    name: 'Charge',
    latex: R`Q = It`,
    category: 'Circuits',
    description: 'Charge that flows past a point for a constant current over time t.',
    variables: [
      { symbol: 'Q', meaning: 'charge', unit: 'C' },
      { symbol: 'I', meaning: 'current', unit: 'A' },
      { symbol: 't', meaning: 'time', unit: 's' }
    ]
  },
  {
    name: 'RC time constant',
    latex: R`\tau = RC`,
    category: 'Circuits',
    description: "Time for a charging or discharging RC circuit's voltage to change by a factor of about 63%.",
    variables: [
      { symbol: '\\tau', meaning: 'time constant', unit: 's' },
      { symbol: 'R', meaning: 'resistance', unit: 'Ω' },
      { symbol: 'C', meaning: 'capacitance', unit: 'F' }
    ]
  },

  // ---- Magnetism ----
  {
    name: 'Magnetic force on a charge',
    latex: R`F = qvB\sin\theta`,
    category: 'Magnetism',
    description: 'Force on a moving charge in a magnetic field (the magnetic part of the Lorentz force).',
    variables: [
      { symbol: 'F', meaning: 'magnetic force', unit: 'N' },
      { symbol: 'q', meaning: 'charge', unit: 'C' },
      { symbol: 'v', meaning: 'speed of the charge', unit: 'm/s' },
      { symbol: 'B', meaning: 'magnetic flux density', unit: 'T' },
      { symbol: '\\theta', meaning: 'angle between velocity and field', unit: 'degrees or rad' }
    ]
  },
  {
    name: 'Force on a current-carrying wire',
    latex: R`F = BIL\sin\theta`,
    category: 'Magnetism',
    description: 'Force on a current-carrying conductor placed in a magnetic field.',
    variables: [
      { symbol: 'F', meaning: 'force on the wire', unit: 'N' },
      { symbol: 'B', meaning: 'magnetic flux density', unit: 'T' },
      { symbol: 'I', meaning: 'current', unit: 'A' },
      { symbol: 'L', meaning: 'length of wire in the field', unit: 'm' },
      { symbol: '\\theta', meaning: 'angle between the wire and field', unit: 'degrees or rad' }
    ]
  },
  {
    name: 'Field around a long wire',
    latex: R`B = \frac{\mu_0 I}{2\pi r}`,
    category: 'Magnetism',
    description: 'Magnetic field strength at a distance r from a long, straight current-carrying wire.',
    variables: [
      { symbol: 'B', meaning: 'magnetic flux density', unit: 'T' },
      { symbol: '\\mu_0', meaning: 'permeability of free space', unit: 'T·m/A' },
      { symbol: 'I', meaning: 'current in the wire', unit: 'A' },
      { symbol: 'r', meaning: 'distance from the wire', unit: 'm' }
    ]
  },
  {
    name: 'Field inside a solenoid',
    latex: R`B = \mu_0 n I`,
    category: 'Magnetism',
    description: 'Magnetic field inside a long, tightly-wound solenoid.',
    variables: [
      { symbol: 'B', meaning: 'magnetic flux density', unit: 'T' },
      { symbol: '\\mu_0', meaning: 'permeability of free space', unit: 'T·m/A' },
      { symbol: 'n', meaning: 'turns per unit length', unit: '1/m' },
      { symbol: 'I', meaning: 'current', unit: 'A' }
    ]
  },
  {
    name: 'Magnetic flux',
    latex: R`\Phi = BA\cos\theta`,
    category: 'Magnetism',
    description: 'The amount of magnetic field passing through a surface.',
    variables: [
      { symbol: '\\Phi', meaning: 'magnetic flux', unit: 'Wb' },
      { symbol: 'B', meaning: 'magnetic flux density', unit: 'T' },
      { symbol: 'A', meaning: 'area of the surface', unit: 'm²' },
      { symbol: '\\theta', meaning: 'angle between B and the surface normal', unit: 'degrees or rad' }
    ]
  },

  // ---- Electromagnetic Induction ----
  {
    name: "Faraday's law",
    latex: R`\varepsilon = -N\frac{d\Phi}{dt}`,
    category: 'Induction',
    description: 'A changing magnetic flux through a coil induces an electromotive force.',
    variables: [
      { symbol: '\\varepsilon', meaning: 'induced emf', unit: 'V' },
      { symbol: 'N', meaning: 'number of turns', unit: 'dimensionless' },
      { symbol: '\\Phi', meaning: 'magnetic flux', unit: 'Wb' },
      { symbol: 't', meaning: 'time', unit: 's' }
    ]
  },
  {
    name: 'Motional emf',
    latex: R`\varepsilon = BLv`,
    category: 'Induction',
    description: 'EMF induced in a conducting rod moving through a magnetic field.',
    variables: [
      { symbol: '\\varepsilon', meaning: 'induced emf', unit: 'V' },
      { symbol: 'B', meaning: 'magnetic flux density', unit: 'T' },
      { symbol: 'L', meaning: 'length of the rod', unit: 'm' },
      { symbol: 'v', meaning: 'speed of the rod', unit: 'm/s' }
    ]
  },
  {
    name: 'Transformer equation',
    latex: R`\frac{V_s}{V_p} = \frac{N_s}{N_p}`,
    category: 'Induction',
    description: "Relates a transformer's voltage ratio to its turns ratio.",
    variables: [
      { symbol: 'V_s, V_p', meaning: 'secondary and primary voltage', unit: 'V' },
      { symbol: 'N_s, N_p', meaning: 'secondary and primary turns', unit: 'dimensionless' }
    ]
  },

  // ---- Optics ----
  {
    name: 'Thin lens equation',
    latex: R`\frac{1}{f} = \frac{1}{d_o} + \frac{1}{d_i}`,
    category: 'Optics',
    description: 'Relates object distance, image distance, and focal length for a thin lens.',
    variables: [
      { symbol: 'f', meaning: 'focal length', unit: 'm' },
      { symbol: 'd_o', meaning: 'object distance', unit: 'm' },
      { symbol: 'd_i', meaning: 'image distance', unit: 'm' }
    ]
  },
  {
    name: 'Magnification',
    latex: R`m = -\frac{d_i}{d_o}`,
    category: 'Optics',
    description: 'Ratio of image size to object size for a lens or mirror.',
    variables: [
      { symbol: 'm', meaning: 'magnification', unit: 'dimensionless' },
      { symbol: 'd_i', meaning: 'image distance', unit: 'm' },
      { symbol: 'd_o', meaning: 'object distance', unit: 'm' }
    ]
  },
  {
    name: 'Refractive index',
    latex: R`n = \frac{c}{v}`,
    category: 'Optics',
    description: 'How much a medium slows light compared to vacuum.',
    variables: [
      { symbol: 'n', meaning: 'refractive index', unit: 'dimensionless' },
      { symbol: 'c', meaning: 'speed of light in vacuum', unit: 'm/s' },
      { symbol: 'v', meaning: 'speed of light in the medium', unit: 'm/s' }
    ]
  },
  {
    name: "Snell's law",
    latex: R`n_1 \sin\theta_1 = n_2 \sin\theta_2`,
    category: 'Optics',
    description: 'Relates the angles of incidence and refraction as light crosses a boundary between two media.',
    variables: [
      { symbol: 'n_1, n_2', meaning: 'refractive indices of the two media', unit: 'dimensionless' },
      { symbol: '\\theta_1', meaning: 'angle of incidence', unit: 'degrees or rad' },
      { symbol: '\\theta_2', meaning: 'angle of refraction', unit: 'degrees or rad' }
    ]
  },
  {
    name: 'Diffraction grating',
    latex: R`d\sin\theta = m\lambda`,
    category: 'Optics',
    description: 'Condition for constructive interference (bright fringes) from a diffraction grating.',
    variables: [
      { symbol: 'd', meaning: 'slit spacing', unit: 'm' },
      { symbol: '\\theta', meaning: 'diffraction angle', unit: 'degrees or rad' },
      { symbol: 'm', meaning: 'order of the fringe', unit: 'integer' },
      { symbol: '\\lambda', meaning: 'wavelength', unit: 'm' }
    ]
  },

  // ---- Modern & Quantum ----
  {
    name: 'Photon energy',
    latex: R`E = hf = \frac{hc}{\lambda}`,
    category: 'Modern Physics',
    description: 'Energy carried by a single photon, proportional to its frequency.',
    variables: [
      { symbol: 'E', meaning: 'photon energy', unit: 'J' },
      { symbol: 'h', meaning: 'Planck constant', unit: 'J·s' },
      { symbol: 'f', meaning: 'frequency', unit: 'Hz' },
      { symbol: 'c', meaning: 'speed of light', unit: 'm/s' },
      { symbol: '\\lambda', meaning: 'wavelength', unit: 'm' }
    ]
  },
  {
    name: 'de Broglie wavelength',
    latex: R`\lambda = \frac{h}{p}`,
    category: 'Modern Physics',
    description: 'Wavelength associated with any moving particle, revealing wave-particle duality.',
    variables: [
      { symbol: '\\lambda', meaning: 'de Broglie wavelength', unit: 'm' },
      { symbol: 'h', meaning: 'Planck constant', unit: 'J·s' },
      { symbol: 'p', meaning: 'momentum', unit: 'kg·m/s' }
    ]
  },
  {
    name: 'Photoelectric effect',
    latex: R`E_{k,\max} = hf - \phi`,
    category: 'Modern Physics',
    description: 'Maximum kinetic energy of electrons ejected from a metal surface by incident light.',
    variables: [
      { symbol: 'E_{k,max}', meaning: 'maximum kinetic energy of ejected electron', unit: 'J' },
      { symbol: 'h', meaning: 'Planck constant', unit: 'J·s' },
      { symbol: 'f', meaning: 'frequency of incident light', unit: 'Hz' },
      { symbol: '\\phi', meaning: 'work function of the metal', unit: 'J' }
    ]
  },
  {
    name: 'Hydrogen energy levels',
    latex: R`E_n = -\frac{13.6\ \text{eV}}{n^2}`,
    category: 'Modern Physics',
    description: 'Allowed energy levels of an electron in a hydrogen atom.',
    variables: [
      { symbol: 'E_n', meaning: 'energy of level n', unit: 'eV' },
      { symbol: 'n', meaning: 'principal quantum number', unit: 'integer (1, 2, 3, …)' }
    ]
  },
  {
    name: 'Heisenberg uncertainty',
    latex: R`\Delta x\,\Delta p \geq \frac{\hbar}{2}`,
    category: 'Modern Physics',
    description: 'Fundamental limit on how precisely position and momentum can be simultaneously known.',
    variables: [
      { symbol: '\\Delta x', meaning: 'uncertainty in position', unit: 'm' },
      { symbol: '\\Delta p', meaning: 'uncertainty in momentum', unit: 'kg·m/s' },
      { symbol: '\\hbar', meaning: 'reduced Planck constant', unit: 'J·s' }
    ]
  },

  // ---- Relativity ----
  {
    name: 'Mass–energy equivalence',
    latex: R`E = mc^2`,
    category: 'Relativity',
    description: 'Mass and energy are equivalent; a mass m has an intrinsic rest energy E.',
    variables: [
      { symbol: 'E', meaning: 'rest energy', unit: 'J' },
      { symbol: 'm', meaning: 'mass', unit: 'kg' },
      { symbol: 'c', meaning: 'speed of light', unit: 'm/s' }
    ]
  },
  {
    name: 'Relativistic energy–momentum',
    latex: R`E^2 = (pc)^2 + (mc^2)^2`,
    category: 'Relativity',
    description: 'General relation between total energy, momentum, and rest mass, valid for both massive and massless particles.',
    variables: [
      { symbol: 'E', meaning: 'total energy', unit: 'J' },
      { symbol: 'p', meaning: 'momentum', unit: 'kg·m/s' },
      { symbol: 'c', meaning: 'speed of light', unit: 'm/s' },
      { symbol: 'm', meaning: 'rest mass', unit: 'kg' }
    ]
  },
  {
    name: 'Lorentz factor',
    latex: R`\gamma = \frac{1}{\sqrt{1 - v^2/c^2}}`,
    category: 'Relativity',
    description: 'Factor by which time, length, and relativistic mass change for an object moving at speed v.',
    variables: [
      { symbol: '\\gamma', meaning: 'Lorentz factor', unit: 'dimensionless' },
      { symbol: 'v', meaning: 'relative speed', unit: 'm/s' },
      { symbol: 'c', meaning: 'speed of light', unit: 'm/s' }
    ]
  },
  {
    name: 'Time dilation',
    latex: R`\Delta t = \gamma\,\Delta t_0`,
    category: 'Relativity',
    description: 'A moving clock runs slow, as measured by a stationary observer.',
    variables: [
      { symbol: '\\Delta t', meaning: 'dilated time interval (stationary observer)', unit: 's' },
      { symbol: '\\gamma', meaning: 'Lorentz factor', unit: 'dimensionless' },
      { symbol: '\\Delta t_0', meaning: 'proper time interval (moving clock)', unit: 's' }
    ]
  },
  {
    name: 'Length contraction',
    latex: R`L = \frac{L_0}{\gamma}`,
    category: 'Relativity',
    description: 'A moving object appears shortened along its direction of motion, as measured by a stationary observer.',
    variables: [
      { symbol: 'L', meaning: 'contracted length (stationary observer)', unit: 'm' },
      { symbol: 'L_0', meaning: 'proper length (object’s own frame)', unit: 'm' },
      { symbol: '\\gamma', meaning: 'Lorentz factor', unit: 'dimensionless' }
    ]
  },

  // ============================= CHEMISTRY =============================

  {
    name: 'Molarity',
    latex: R`M = \frac{n}{V}`,
    category: 'Chemistry',
    description: 'Concentration of a solution expressed as moles of solute per liter of solution.',
    variables: [
      { symbol: 'M', meaning: 'molarity', unit: 'mol/L' },
      { symbol: 'n', meaning: 'moles of solute', unit: 'mol' },
      { symbol: 'V', meaning: 'volume of solution', unit: 'L' }
    ]
  },
  {
    name: 'Dilution equation',
    latex: R`M_1 V_1 = M_2 V_2`,
    category: 'Chemistry',
    description: 'Relates the concentration and volume of a solution before and after dilution.',
    variables: [
      { symbol: 'M_1, V_1', meaning: 'initial concentration and volume', unit: 'mol/L, L' },
      { symbol: 'M_2, V_2', meaning: 'final concentration and volume', unit: 'mol/L, L' }
    ]
  },
  {
    name: 'pH',
    latex: R`\text{pH} = -\log_{10}[\text{H}^+]`,
    category: 'Chemistry',
    description: "A measure of a solution's acidity, based on hydrogen ion concentration.",
    variables: [
      { symbol: '\\text{pH}', meaning: 'pH value', unit: 'dimensionless' },
      { symbol: '[\\text{H}^+]', meaning: 'hydrogen ion concentration', unit: 'mol/L' }
    ]
  },
  {
    name: 'pOH',
    latex: R`\text{pOH} = -\log_{10}[\text{OH}^-]`,
    category: 'Chemistry',
    description: "A measure of a solution's basicity, based on hydroxide ion concentration; pH + pOH = 14 in water at 25°C.",
    variables: [
      { symbol: '\\text{pOH}', meaning: 'pOH value', unit: 'dimensionless' },
      { symbol: '[\\text{OH}^-]', meaning: 'hydroxide ion concentration', unit: 'mol/L' }
    ]
  },
  {
    name: 'Henderson–Hasselbalch equation',
    latex: R`\text{pH} = \text{p}K_a + \log_{10}\frac{[\text{A}^-]}{[\text{HA}]}`,
    category: 'Chemistry',
    description: 'Calculates the pH of a buffer solution from the ratio of conjugate base to weak acid.',
    variables: [
      { symbol: '\\text{pH}', meaning: 'pH of the buffer', unit: 'dimensionless' },
      { symbol: '\\text{p}K_a', meaning: 'acid dissociation constant (−log K_a)', unit: 'dimensionless' },
      { symbol: '[\\text{A}^-]', meaning: 'conjugate base concentration', unit: 'mol/L' },
      { symbol: '[\\text{HA}]', meaning: 'weak acid concentration', unit: 'mol/L' }
    ]
  },
  {
    name: 'Equilibrium constant',
    latex: R`K_c = \frac{[\text{C}]^{c}[\text{D}]^{d}}{[\text{A}]^{a}[\text{B}]^{b}}`,
    category: 'Chemistry',
    description: 'Ratio of product to reactant concentrations, each raised to its stoichiometric coefficient, at chemical equilibrium.',
    variables: [
      { symbol: 'K_c', meaning: 'equilibrium constant', unit: 'dimensionless' },
      { symbol: '[\\text{A}], [\\text{B}]', meaning: 'reactant concentrations', unit: 'mol/L' },
      { symbol: '[\\text{C}], [\\text{D}]', meaning: 'product concentrations', unit: 'mol/L' },
      { symbol: 'a, b, c, d', meaning: 'stoichiometric coefficients', unit: 'dimensionless' }
    ]
  },
  {
    name: 'First-order rate law',
    latex: R`[\text{A}] = [\text{A}]_0\,e^{-kt}`,
    category: 'Chemistry',
    description: 'Concentration of a reactant over time in a first-order reaction.',
    variables: [
      { symbol: '[\\text{A}]', meaning: 'concentration at time t', unit: 'mol/L' },
      { symbol: '[\\text{A}]_0', meaning: 'initial concentration', unit: 'mol/L' },
      { symbol: 'k', meaning: 'rate constant', unit: '1/s' },
      { symbol: 't', meaning: 'time', unit: 's' }
    ]
  },
  {
    name: 'Half-life (first order)',
    latex: R`t_{1/2} = \frac{\ln 2}{k}`,
    category: 'Chemistry',
    description: 'Time for half of a first-order reactant to be consumed, independent of starting concentration.',
    variables: [
      { symbol: 't_{1/2}', meaning: 'half-life', unit: 's' },
      { symbol: 'k', meaning: 'rate constant', unit: '1/s' }
    ]
  },
  {
    name: 'Arrhenius equation',
    latex: R`k = A e^{-E_a/(RT)}`,
    category: 'Chemistry',
    description: 'Describes how a reaction’s rate constant depends on temperature and activation energy.',
    variables: [
      { symbol: 'k', meaning: 'rate constant', unit: 'varies with reaction order' },
      { symbol: 'A', meaning: 'pre-exponential (frequency) factor', unit: 'same units as k' },
      { symbol: 'E_a', meaning: 'activation energy', unit: 'J/mol' },
      { symbol: 'R', meaning: 'gas constant', unit: 'J/(mol·K)' },
      { symbol: 'T', meaning: 'temperature', unit: 'K' }
    ]
  },
  {
    name: 'Beer–Lambert law',
    latex: R`A = \epsilon c l`,
    category: 'Chemistry',
    description: 'Relates the absorbance of light by a solution to its concentration and path length.',
    variables: [
      { symbol: 'A', meaning: 'absorbance', unit: 'dimensionless' },
      { symbol: '\\epsilon', meaning: 'molar absorptivity', unit: 'L/(mol·cm)' },
      { symbol: 'c', meaning: 'concentration', unit: 'mol/L' },
      { symbol: 'l', meaning: 'path length', unit: 'cm' }
    ]
  },
  {
    name: 'Gibbs free energy',
    latex: R`\Delta G = \Delta H - T\Delta S`,
    category: 'Chemistry',
    description: 'Determines whether a reaction is spontaneous: a negative ΔG indicates a spontaneous process.',
    variables: [
      { symbol: '\\Delta G', meaning: 'change in Gibbs free energy', unit: 'J' },
      { symbol: '\\Delta H', meaning: 'change in enthalpy', unit: 'J' },
      { symbol: 'T', meaning: 'temperature', unit: 'K' },
      { symbol: '\\Delta S', meaning: 'change in entropy', unit: 'J/K' }
    ]
  },
  {
    name: 'Nernst equation',
    latex: R`E = E^\circ - \frac{RT}{nF}\ln Q`,
    category: 'Chemistry',
    description: 'Relates the cell potential of an electrochemical cell to its standard potential and the reaction conditions.',
    variables: [
      { symbol: 'E', meaning: 'cell potential', unit: 'V' },
      { symbol: 'E^\\circ', meaning: 'standard cell potential', unit: 'V' },
      { symbol: 'R', meaning: 'gas constant', unit: 'J/(mol·K)' },
      { symbol: 'T', meaning: 'temperature', unit: 'K' },
      { symbol: 'n', meaning: 'moles of electrons transferred', unit: 'mol' },
      { symbol: 'F', meaning: 'Faraday constant', unit: 'C/mol' },
      { symbol: 'Q', meaning: 'reaction quotient', unit: 'dimensionless' }
    ]
  },

  // ============================= BIOLOGY =============================

  {
    name: 'Exponential population growth',
    latex: R`N(t) = N_0 e^{rt}`,
    category: 'Biology',
    description: 'Models unrestricted population growth, proportional to the current population size.',
    variables: [
      { symbol: 'N(t)', meaning: 'population size at time t', unit: 'individuals' },
      { symbol: 'N_0', meaning: 'initial population size', unit: 'individuals' },
      { symbol: 'r', meaning: 'intrinsic growth rate', unit: '1/time' },
      { symbol: 't', meaning: 'time', unit: 'time (e.g. years)' }
    ]
  },
  {
    name: 'Logistic population growth',
    latex: R`\frac{dN}{dt} = rN\left(1 - \frac{N}{K}\right)`,
    category: 'Biology',
    description: "Models population growth that slows as it approaches the environment's carrying capacity.",
    variables: [
      { symbol: 'dN/dt', meaning: 'rate of population change', unit: 'individuals/time' },
      { symbol: 'r', meaning: 'intrinsic growth rate', unit: '1/time' },
      { symbol: 'N', meaning: 'population size', unit: 'individuals' },
      { symbol: 'K', meaning: 'carrying capacity', unit: 'individuals' }
    ]
  },
  {
    name: 'Hardy–Weinberg equilibrium',
    latex: R`p^2 + 2pq + q^2 = 1`,
    category: 'Biology',
    description: 'Predicts genotype frequencies in a non-evolving population from its allele frequencies.',
    variables: [
      { symbol: 'p', meaning: 'frequency of the dominant allele', unit: 'dimensionless (0–1)' },
      { symbol: 'q', meaning: 'frequency of the recessive allele', unit: 'dimensionless (0–1)' },
      { symbol: 'p^2', meaning: 'frequency of the homozygous dominant genotype', unit: 'dimensionless' },
      { symbol: '2pq', meaning: 'frequency of the heterozygous genotype', unit: 'dimensionless' },
      { symbol: 'q^2', meaning: 'frequency of the homozygous recessive genotype', unit: 'dimensionless' }
    ]
  },
  {
    name: 'Michaelis–Menten enzyme kinetics',
    latex: R`v = \frac{V_{\max}[\text{S}]}{K_M + [\text{S}]}`,
    category: 'Biology',
    description: 'Describes the rate of an enzyme-catalyzed reaction as a function of substrate concentration.',
    variables: [
      { symbol: 'v', meaning: 'reaction rate', unit: 'mol/(L·s)' },
      { symbol: 'V_{max}', meaning: 'maximum reaction rate', unit: 'mol/(L·s)' },
      { symbol: '[\\text{S}]', meaning: 'substrate concentration', unit: 'mol/L' },
      { symbol: 'K_M', meaning: 'Michaelis constant (substrate concentration at half V_max)', unit: 'mol/L' }
    ]
  },
  {
    name: 'Surface-area-to-volume ratio (sphere)',
    latex: R`\frac{SA}{V} = \frac{3}{r}`,
    category: 'Biology',
    description: 'As a cell or organism grows larger, its surface-area-to-volume ratio shrinks, limiting the rate of diffusion and heat exchange relative to volume.',
    variables: [
      { symbol: 'SA', meaning: 'surface area', unit: 'm² (or consistent length unit squared)' },
      { symbol: 'V', meaning: 'volume', unit: 'm³ (or consistent length unit cubed)' },
      { symbol: 'r', meaning: 'radius (modeling the cell/organism as a sphere)', unit: 'm' }
    ]
  }
]

/**
 * Keeps the built-in equation set in sync with the SEEDS array above.
 * Built-ins aren't user-editable, so it's safe to fully replace them on every
 * startup — this also means updates to SEEDS (new equations, corrected
 * descriptions/variables) reach existing installs automatically, not just
 * brand-new ones.
 */
/** Kebab-cases a string for use in a stable slug (lowercase alphanumerics + dashes). */
function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Deterministic, collision-free slug per seed, derived from category + name in
 * the (stable) SEEDS order. Because these slugs never change between runs,
 * relationships/derivations keyed on them survive the built-in reseed below —
 * that's the whole point of decoupling knowledge-graph data from the volatile
 * autoincrement ids.
 */
function builtinSlugs(): string[] {
  const used = new Set<string>()
  return SEEDS.map((s) => {
    const base = `builtin-${kebab(s.category)}-${kebab(s.name)}`
    let slug = base
    let n = 2
    while (used.has(slug)) slug = `${base}-${n++}`
    used.add(slug)
    return slug
  })
}

export function syncBuiltinEquations(): void {
  const db = getDb()
  const ts = Date.now()
  const slugs = builtinSlugs()
  const insert = db.prepare(
    `INSERT INTO equations
       (name, latex, description, category, variables_json, tags, is_builtin, slug, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
  )
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM equations WHERE is_builtin = 1`).run()
    SEEDS.forEach((s, i) => {
      insert.run(
        s.name,
        s.latex,
        s.description,
        s.category,
        JSON.stringify(s.variables),
        (s.tags ?? []).join(','),
        slugs[i],
        ts,
        ts
      )
    })
  })
  tx()
}
