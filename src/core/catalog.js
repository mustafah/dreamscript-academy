// A small, built-in catalog of image models. DreamScript checks renderer
// parameters against it (teaching tool: nothing is sent anywhere).

export const IMAGE_SIZES = {
  landscape_4_3: [1024, 768],
  landscape_16_9: [1024, 576],
  square_hd: [1024, 1024],
  square: [512, 512],
  portrait_3_4: [768, 1024],
  portrait_16_9: [576, 1024],
};

const text = { type: 'text' };
const bool = { type: 'bool' };
const seed = { type: 'int' };
const size = { type: 'enum', values: Object.keys(IMAGE_SIZES) };
const images = (max) => ({ type: 'int', min: 1, max });

export const MODELS = {
  'fal-ai/flux/schnell': {
    label: 'FLUX.1 [schnell]',
    params: { prompt: text, image_size: size, num_inference_steps: { type: 'int', min: 1, max: 12 }, seed, num_images: images(4), enable_safety_checker: bool },
  },
  'fal-ai/flux/dev': {
    label: 'FLUX.1 [dev]',
    params: {
      prompt: text, image_size: size, num_inference_steps: { type: 'int', min: 1, max: 50 }, guidance_scale: { type: 'number', min: 1, max: 20 },
      seed, num_images: images(4), enable_safety_checker: bool, image_url: text, strength: { type: 'number', min: 0, max: 1 },
    },
  },
  'fal-ai/stable-diffusion-v3': {
    label: 'Stable Diffusion 3',
    params: { prompt: text, negative_prompt: text, image_size: size, num_inference_steps: { type: 'int', min: 1, max: 60 }, guidance_scale: { type: 'number', min: 1, max: 20 }, seed, num_images: images(4) },
  },
  'fal-ai/esrgan': { label: 'ESRGAN upscaler', params: { image_url: text, scale: { type: 'int', min: 2, max: 4 } } },
  'bedrock/stable-image': {
    label: 'Stable Image (Bedrock)',
    params: { prompt: text, negative_prompt: text, aspect_ratio: { type: 'enum', values: ['1:1', '16:9', '3:4', '4:3'] }, seed, num_images: images(2) },
  },
};

// Parameters DreamScript keeps for itself (they are not sent to the model).
export const RESERVED = new Set(['title', 'label']);
