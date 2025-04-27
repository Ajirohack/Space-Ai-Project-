"""
Configuration utility for the Superior RAG system.

This module provides functions to load and merge configuration files.
"""

import os
import logging
import yaml
import re
from typing import Dict, Any, Optional
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("superior_rag.utils.config")

# Default configuration paths
DEFAULT_CONFIG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "config",
    "default.yaml"
)

# Environment variable for configuration mode
ENV_CONFIG_MODE = os.getenv("CONFIG_MODE", "development")

def load_config(config_mode: Optional[str] = None) -> Dict[str, Any]:
    """
    Load and merge configuration files.
    
    Args:
        config_mode: The configuration mode to use (development, production, etc.)
        
    Returns:
        Dict[str, Any]: The merged configuration
    """
    # Use environment variable if not specified
    if config_mode is None:
        config_mode = ENV_CONFIG_MODE
        
    logger.debug(f"Loading configuration for mode: {config_mode}")
    
    # Load default configuration
    config = _load_yaml_config(DEFAULT_CONFIG_PATH)
    logger.debug(f"Loaded default configuration from {DEFAULT_CONFIG_PATH}")
    
    # Load mode-specific configuration if it exists
    config_dir = os.path.dirname(DEFAULT_CONFIG_PATH)
    mode_config_path = os.path.join(config_dir, f"{config_mode}.yaml")
    
    if os.path.exists(mode_config_path):
        mode_config = _load_yaml_config(mode_config_path)
        logger.debug(f"Loaded {config_mode} configuration from {mode_config_path}")
        
        # Merge configurations
        config = _deep_merge_configs(config, mode_config)
        logger.debug(f"Merged {config_mode} configuration with default")
    else:
        logger.warning(f"No configuration found for mode {config_mode} at {mode_config_path}")
        
    # Substitute environment variables in config values
    config = _substitute_env_vars(config)
    
    return config

def _load_yaml_config(file_path: str) -> Dict[str, Any]:
    """
    Load a YAML configuration file.
    
    Args:
        file_path: Path to the YAML file
        
    Returns:
        Dict[str, Any]: The loaded configuration
        
    Raises:
        FileNotFoundError: If the file does not exist
        yaml.YAMLError: If the file is invalid YAML
    """
    try:
        with open(file_path, 'r') as file:
            return yaml.safe_load(file) or {}
    except yaml.YAMLError as e:
        logger.error(f"Error parsing YAML configuration file {file_path}: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error loading configuration file {file_path}: {str(e)}")
        raise

def _deep_merge_configs(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deep merge two configuration dictionaries.
    
    The override dictionary takes precedence over the base dictionary.
    
    Args:
        base: The base configuration
        override: The configuration to override with
        
    Returns:
        Dict[str, Any]: The merged configuration
    """
    result = base.copy()
    
    for key, value in override.items():
        if isinstance(value, dict) and key in result and isinstance(result[key], dict):
            # Recursively merge nested dictionaries
            result[key] = _deep_merge_configs(result[key], value)
        else:
            # Override or add value
            result[key] = value
            
    return result

def _substitute_env_vars(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Substitute environment variables in string configuration values.
    
    Environment variables are specified as "${VAR_NAME}" and are replaced
    with their values from os.environ.
    
    Args:
        config: The configuration to process
        
    Returns:
        Dict[str, Any]: The processed configuration
    """
    def _process_value(value: Any) -> Any:
        if isinstance(value, str):
            # Find all environment variable references
            pattern = r'\$\{([A-Za-z0-9_]+)\}'
            matches = re.findall(pattern, value)
            
            # Replace each match with its environment variable value
            result = value
            for match in matches:
                env_value = os.environ.get(match)
                if env_value is not None:
                    result = result.replace(f"${{{match}}}", env_value)
                else:
                    logger.warning(f"Environment variable '{match}' not found, using empty string")
                    result = result.replace(f"${{{match}}}", "")
                    
            return result
        elif isinstance(value, dict):
            # Process nested dictionaries
            return {k: _process_value(v) for k, v in value.items()}
        elif isinstance(value, list):
            # Process list items
            return [_process_value(item) for item in value]
        else:
            # Return other values unchanged
            return value
        
    return _process_value(config)
