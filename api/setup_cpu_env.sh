#!/bin/bash
# Setup script to force CPU usage and avoid CUDA compatibility issues

echo "Setting up CPU-only environment..."

# Force CPU usage
export CUDA_VISIBLE_DEVICES=""
export TORCH_DEVICE="cpu"
export PYTORCH_CUDA_ALLOC_CONF="max_split_size_mb:128"

# Additional environment variables for PyTorch
export PYTORCH_NO_CUDA_MEMORY_CACHING=1
export TORCH_USE_CUDA_DSA=0

# For transformers library
export TRANSFORMERS_OFFLINE=0
export HF_HUB_OFFLINE=0

echo "Environment variables set:"
echo "CUDA_VISIBLE_DEVICES: $CUDA_VISIBLE_DEVICES"
echo "TORCH_DEVICE: $TORCH_DEVICE"
echo "PYTORCH_CUDA_ALLOC_CONF: $PYTORCH_CUDA_ALLOC_CONF"

echo "CPU-only environment setup complete!"
echo "You can now run your Python scripts safely."
