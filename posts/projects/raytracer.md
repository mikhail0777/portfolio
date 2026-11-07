---
title: "Ray tracer in Rust"
summary: "or how to trick yourself into learning some statistics"
coverImage: "/assets/raytrace.png"
order: 1
---

I wanted to build a renderer because graphics has a useful way of turning abstract math into something I can inspect. If an intersection is wrong, a mesh tears. If a probability distribution is wrong, the image gets noisy or biased. The feedback loop is immediate, but getting a clean image still forces me to understand what the code is estimating.

This project became a small CPU path tracer written in Rust. The current scene loader reads a triangulated OBJ with vertex normals, uses an EXR environment map for illumination, and writes the accumulated result back to a linear EXR. The cover render uses 512 samples per pixel at 1280×720; my recorded run took about two minutes, after which I used Blender's compositor for Filmic tone mapping.

For comparison, I also rendered the same scene in Blender Cycles at 32 samples and 1280×720:

![The same Suzanne scene rendered in Blender Cycles](/assets/raytrace-cycles.png)

Cycles converged to a cleaner image with far fewer samples. That comparison was more useful than declaring either renderer “faster”: my old notes measured roughly 271 ns per pixel-sample for this tracer and 388 ns for that Cycles run, but they are very different rendering kernels with different sampling strategies and feature sets. The important result was that raw throughput did not compensate for samples spent in unhelpful directions.

## From a pixel to a path

The renderer starts by building a perspective camera. For each sample pass, it walks every pixel in parallel with Rayon, jitters the pixel coordinate, transforms the point through the inverse projection, and creates a camera ray. Each call to `sample_once` produces one sample for the whole image; the main loop accumulates 512 of those matrices before dividing by the sample count.

From there, `Scene::sample` follows a compact recursive pipeline:

1. Find the nearest triangle hit through the scene BVH.
2. Interpolate the triangle's vertex normals with barycentric coordinates.
3. Build a local coordinate frame around that normal.
4. Sample a new direction from the material distribution.
5. Offset the new ray origin slightly to avoid immediately hitting the same surface.
6. Trace the next bounce, up to the configured limit of eight.

If a ray misses the mesh, the renderer converts its direction to equirectangular UV coordinates and bilinearly samples the HDR environment map. That environment is both the visible background and the light source in the current implementation.

## The rendering equation in code

The quantity I am trying to estimate is outgoing radiance:

$$
L_o(\mathbf{x}, \omega_o) = L_e(\mathbf{x}, \omega_o) + \int_{\Omega} f(\mathbf{x}, \omega_i, \omega_o) L_i(\mathbf{x}, \omega_i) (\omega_i \cdot \mathbf{n}) d\omega_i
$$

The integral asks how much light arrives from every direction above a surface, how the material responds to it, and how strongly that direction aligns with the surface normal. For a real scene there is no practical closed-form answer, so the renderer estimates it with Monte Carlo samples:

$$
\int f(x)dx \approx \frac{1}{N}\sum_{i=1}^{N}\frac{f(x_i)}{p(x_i)}, \qquad x_i \sim p(x)
$$

In the code, the recursive call supplies the incoming radiance. The active material is Lambertian with a constant albedo, and its sampler produces a cosine-weighted hemisphere direction in the surface's local frame. Its probability density is the cosine with the normal, so the cosine term in the rendering equation cancels with the PDF. What remains at each diffuse bounce is the recursively sampled light scaled by the albedo.

That cancellation was the point where importance sampling stopped feeling like a formula and started feeling like an engineering tool. Uniform hemisphere sampling is unbiased, but it spends many rays near the horizon where the cosine term contributes almost nothing. Matching the sampling distribution to the diffuse BRDF puts more work where it matters and reduces variance without changing the quantity being estimated.

The repository also contains the outline of a glossy BSDF, but it is not wired into the active render path. I have kept this article honest about that: the demonstrated scene uses diffuse transport. A proper specular implementation would need consistent `sample`, `value`, and PDF behavior for a delta distribution rather than just a reflection-vector helper.

![A development render showing diffuse and reflective material experiments](/assets/raytrace-mixed.png)

## Intersections and the BVH

Every bounce needs the closest surface along a ray. Testing every triangle would make that cost grow directly with mesh size, so I build a bounding volume hierarchy once before rendering. I use the open-source Rust `bvh` crate for construction and traversal, then test only the candidate triangles returned by that traversal.

The final ray-triangle test is the Möller–Trumbore algorithm. That function in the project was adapted from the algorithm's Wikipedia pseudocode rather than authored from scratch. Once it returns the nearest distance and triangle index, I compute barycentric coordinates and use them to interpolate the OBJ vertex normals for smooth shading.

Using a crate let me get to a working acceleration structure quickly, but it also taught me where abstraction can limit experimentation. Building my own BVH would make it easier to explore split heuristics, memory layout, traversal order, and instrumentation. That is one of the clearest next steps if I return to the renderer.

## Why Rust worked well here

Rust gave me a practical structure for separating geometry, camera math, textures, BSDFs, scene traversal, and output without hiding the data flow. `nalgebra` handles vectors and transforms, Rayon parallelizes independent pixel work, and the `exr` crate keeps the pipeline in linear high-dynamic-range color until post-processing.

The project also exposed places where “fast” code can still be fragile. The random-number generator is currently a single mutable global seed, which is not an appropriate design for parallel Rayon workers. A future version should use independent per-thread or per-pixel generators with explicit seeds. I would also add tests around camera transforms, sampling distributions, texture lookup boundaries, and intersection edge cases before treating performance measurements as rigorous.

## What I would improve next

The largest image-quality improvement would be sampling the lights as well as the material. Right now the renderer only samples the diffuse BSDF, so a small bright region in the environment can still be difficult to find. Direct environment-light sampling combined with multiple importance sampling would balance both distributions and should reduce noise much more effectively than simply increasing the sample count.

I would also like to:

- finish and validate specular and rough-material models;
- replace the shared random seed with deterministic parallel sampling;
- add Russian roulette termination instead of relying only on a fixed eight-bounce limit;
- implement and benchmark a custom BVH;
- move tone mapping and color transforms into a deliberate, tested color pipeline; and
- add a scene format instead of hard-coding one OBJ, one camera, and one environment map.

The main lesson was not that I could outrun a production renderer. It was that renderer performance is inseparable from variance. Rust and parallelism made each sample reasonably cheap, but the probability distribution decided how useful that sample was. That is the part of the project I still find most interesting.

Source: [mikhail0777/Raytracer](https://github.com/mikhail0777/Raytracer)
