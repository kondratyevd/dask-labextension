import { Dialog, showDialog } from '@jupyterlab/apputils';

import * as React from 'react';

// const DEFAULT_CLUSTER_TYPE = "dask-gateway-k8s-slurm";
const DEFAULT_MIN_WORKERS = 1;
const DEFAULT_MAX_WORKERS = 1;
const MIN_POSSIBLE_WORKERS = 0;
const MAX_POSSIBLE_WORKERS = 1000;
const DEFAULT_WORKER_CORES = 1;
const DEFAULT_WORKER_MEMORY = 4;

interface KernelSpecs {
  default: string;
  kernelspecs: {
    [key: string]: {
      name: string;
      spec: {
        argv: string[];
        display_name: string;
        language: string;
      };
    }
  }
}

interface Kernel {
  name: string;
  display_name: string;
  python_exec_path: string;
}

interface UserInfo {
  identity: {
    username: string
  }
}

namespace ClusterConfig {
  export interface IState {
    cluster_type: string;
    kernel: Kernel;
    user_info: UserInfo;
    min_workers: number;
    max_workers: number;
    worker_cores: number;
    worker_memory: number;
  }
  export interface IProps {
    cluster_type: string;
    kernelspecs: KernelSpecs;
    kernel: Kernel;
    user_info: UserInfo;
    min_workers: number;
    max_workers: number;
    worker_cores: number;
    worker_memory: number;
    stateEscapeHatch: (cluster_type: string, kernel: Kernel, min_workers: number, max_workers: number, worker_cores: number, worker_memory: number) => void;
  }
}

export class ClusterConfig extends React.Component<ClusterConfig.IProps, ClusterConfig.IState> {
  
  constructor(props: ClusterConfig.IProps) {
    super(props);
    const cluster_type = props.cluster_type;
    const kernel = props.kernel;
    const user_info = props.user_info;
    const min_workers = props.min_workers;
    const max_workers = props.max_workers;
    const worker_cores = props.worker_cores;
    const worker_memory = props.worker_memory;
    this.state = { cluster_type, kernel, user_info, min_workers, max_workers, worker_cores, worker_memory};
  }

  componentDidMount() {
    this.resetValues();
  }

  componentDidUpdate(): void {
    this.props.stateEscapeHatch(this.state.cluster_type, this.state.kernel, this.state.min_workers, this.state.max_workers, this.state.worker_cores, this.state.worker_memory);
  }

  resetValues(): void {
    let username = this.props.user_info.identity.username;
    const cluster_type = username.includes("-cern") || username.includes("-fnal")
    ? "dask-gateway-k8s"
    : "dask-gateway-k8s-slurm";
    const ks = this.props.kernelspecs;
    const kernel = {
      name: ks.default,
      display_name: ks.kernelspecs[ks.default].spec.display_name,
      python_exec_path: ks.kernelspecs[ks.default].spec.argv[0]
    };
    const min_workers = DEFAULT_MIN_WORKERS;
    const max_workers = DEFAULT_MAX_WORKERS;
    const worker_cores = DEFAULT_WORKER_CORES;
    const worker_memory = DEFAULT_WORKER_MEMORY;
    this.setState({ cluster_type, kernel, min_workers, max_workers, worker_cores, worker_memory });
    this.props.stateEscapeHatch(cluster_type, kernel, min_workers, max_workers, worker_cores, worker_memory);
  }

  onClusterTypeChanged(event: React.ChangeEvent<{ value: unknown }>): void {
    this.setState({
      cluster_type: event.target.value as string,
    });
  }

  onKernelChanged(event: React.ChangeEvent<{ value: unknown }>): void {
    // if (this.state.cluster_type == "local") { return }
    const kernel_name = event.target.value as string;
    const ks = this.props.kernelspecs;
    const kernel = {
      name: kernel_name,
      display_name: ks.kernelspecs[kernel_name].spec.display_name,
      python_exec_path: ks.kernelspecs[kernel_name].spec.argv[0]
    };
    this.setState({
      kernel: kernel
    });
  }

  onMinimumChanged(event: React.ChangeEvent): void {
    const inputVal = (event.target as HTMLInputElement).value;
    const value = parseInt(inputVal, 10);
    if (isNaN(value)) {
      this.setState({
        min_workers: DEFAULT_MIN_WORKERS
      });
    } else {
      const minimum = Math.min(Math.max(MIN_POSSIBLE_WORKERS, value), MAX_POSSIBLE_WORKERS);
      const maximum = Math.min(Math.max(this.state.max_workers, minimum), MAX_POSSIBLE_WORKERS);
      this.setState({
        min_workers: minimum,
        max_workers: maximum
      });
    }
  }
  
  onMaximumChanged(event: React.ChangeEvent): void {
    const inputVal = (event.target as HTMLInputElement).value;
    const value = parseInt(inputVal, 10);
    if (isNaN(value)) {
      this.setState({
        max_workers: DEFAULT_MAX_WORKERS
      });
    } else {
      const maximum = Math.min(Math.max(MIN_POSSIBLE_WORKERS, value),MAX_POSSIBLE_WORKERS);
      const minimum = Math.min(this.state.min_workers, maximum);
      this.setState({
        min_workers: minimum,
        max_workers: maximum
      });
    }
  }

  onWorkerCoresChanged(event: React.ChangeEvent<{ value: unknown }>): void {
    const inputVal = (event.target as HTMLInputElement).value;
    const value = parseInt(inputVal, 10);
    if (isNaN(value) || value < 1) {
      this.setState({
        worker_cores: DEFAULT_WORKER_CORES
      });
    } else {
      this.setState({
        worker_cores: value
      });
    }
  }  

  onWorkerMemoryChanged(event: React.ChangeEvent<{ value: unknown }>): void {
    const inputVal = (event.target as HTMLInputElement).value;
    const value = parseFloat(inputVal);
    if (isNaN(value) || value < 0) {
      this.setState({
        worker_memory: DEFAULT_WORKER_MEMORY
      });
    } else {
      this.setState({
        worker_memory: value
      });
    }
  }

  /**
   * Render the component..
   */
  render() {
    const cluster_type = this.state.cluster_type;
    const min_workers = this.state.min_workers;
    const max_workers = this.state.max_workers;
    const worker_cores = this.state.worker_cores;
    const worker_memory = this.state.worker_memory;
    const ks = this.props.kernelspecs;
    const disabledClass = 'dask-mod-disabled';
    return (
    <div>
      <div>
        <span className="dask-ClusterConfigHeader">Cluster type</span>
        <div className="dask-ClusterConfigSection">
          <div className="dask-ClusterConfigSection-item">
            <label>
              <input
                type="radio"
                name="clusterType"
                value="dask-gateway-k8s-slurm"
                checked={cluster_type=="dask-gateway-k8s-slurm"}
                onChange={evt => {
                  this.onClusterTypeChanged(evt);
                }}
              />
              DaskGateway + SLURM 
              <div style={{fontSize: 'smaller', fontStyle: 'italic', marginLeft: '10px'}}>
                (Hammer cluster: <span style={{color: 'red'}}>Purdue users only</span>)
              </div>
            </label>
          </div>
          <div className="dask-ClusterConfigSection-item">
            <label>
              <input
                type="radio"
                name="clusterType"
                value="dask-gateway-k8s"
                checked={cluster_type=="dask-gateway-k8s"}
                onChange={evt => {
                  this.onClusterTypeChanged(evt);
                }}
              />
              DaskGateway + Kubernetes 
              <div style={{fontSize: 'smaller', fontStyle: 'italic', marginLeft: '10px'}}>
                (Geddes cluster: <span style={{color: 'green'}}>All users</span>)
              </div>
            </label>
          </div>
          {/* <div className="dask-ClusterConfigSection-item">
            <label>
              <input
                type="radio"
                name="clusterType"
                value="dask-gateway-k8s"
                checked={cluster_type=="dask-gateway-k8s"}
                onChange={evt => {
                  this.onClusterTypeChanged(evt);
                }}
              />
              DaskGateway for LPC HATS 2024
            </label>
          </div> */}
        </div>
      </div>
      <div>
        <span className="dask-ScalingHeader">Kernel / Conda environment</span>
        <div className="dask-ClusterConfigSection">
          <select
                  className={`dask-ClusterConfigSelect ${
                    cluster_type=="local" ? disabledClass : ''
                  }`}
                  disabled={cluster_type=="local"}
                  value={this.state.kernel.name}
                  onChange={evt => {
                    this.onKernelChanged(evt);
                  }}
                >
                  {Object.values(ks.kernelspecs)
                    .filter(kernel => kernel.spec.language === "python")
                    .map(kernel => (
                      <option key={kernel.name} value={kernel.name}>
                        {kernel.spec.display_name}
                      </option>
                    ))}
          </select>
        </div>
      </div>
      <div>
        <span className="dask-ScalingHeader">Number of workers</span>
        <div className="dask-ScalingSection">
          <div className="dask-ScalingSection-item">
            <span className={"dask-ScalingSection-label"}>
              Minimum workers
            </span>
            <input
              className="dask-ScalingInput"
              disabled={false}
              type="number"
              value={min_workers}
              min="0"
              step="1"
              onChange={evt => {
                this.onMinimumChanged(evt);
              }}
            />
          </div>
        </div>
        <div className="dask-ScalingSection">
          <div className="dask-ScalingSection-item">
            <span className={"dask-ScalingSection-label"}>
              Maximum workers
            </span>
            <input
              className="dask-ScalingInput"
              disabled={false}
              type="number"
              value={max_workers}
              min="0"
              step="1"
              onChange={evt => {
                this.onMaximumChanged(evt);
              }}
            />
          </div>
        </div>
      </div>
      <div>
        <span className="dask-ScalingHeader">Worker resources</span>
        <div className="dask-ClusterConfigSection">
          <div className="dask-ScalingSection-item">
            <span className={"dask-ScalingSection-label"}>
              Cores per worker
            </span>
            <input
              className="dask-ScalingInput"
              disabled={false}
              type="number"
              value={worker_cores}
              min="1"
              max="32"
              step="1"
              onChange={evt => {
                this.onWorkerCoresChanged(evt);
              }}
            />
          </div>
          <div className="dask-ScalingSection-item">
            <span className={"dask-ScalingSection-label"}>
              Worker memory [GB]
            </span>
            <input
              className="dask-ScalingInput"
              disabled={false}
              type="number"
              value={worker_memory}
              min="1"
              max="16"
              step="0.1"
              onChange={evt => {
                this.onWorkerMemoryChanged(evt);
              }}
            />
          </div>
        </div>
      </div>
    </div>
    );
  }
}

/**
 * Show a dialog for configuring a cluster model.
 *
 * @returns a promse that resolves with the user-selected cluster configuration.
 *   If they pressed the cancel button, it resolves with the original model.
 */

export function showClusterConfigDialog(kernelspecs: KernelSpecs, user_info: UserInfo): Promise<{}|null> {
  let new_config = {}

  let username = user_info.identity.username;
  const cluster_type = username.includes("-cern") || username.includes("-fnal")
    ? "dask-gateway-k8s"
    : "dask-gateway-k8s-slurm";

  const escapeHatch = (cluster_type: string, kernel: Kernel, min_workers: number, max_workers: number, worker_cores: number, worker_memory: number) => {
    console.log("Exec path:")
    console.log(kernel.python_exec_path)
    if (cluster_type=="dask-gateway-k8s-slurm") {
      new_config = {
        default: {
          adapt: {
              minimum: min_workers,
              maximum: max_workers
            }
        },
        factory: {
          class: "GatewayCluster",
          module: "dask_gateway",
          args: [],
          kwargs: {
            address: "http://dask-gateway-k8s-slurm.geddes.rcac.purdue.edu",
            proxy_address: "api-dask-gateway-k8s-slurm.cms.geddes.rcac.purdue.edu:8000",
            public_address: "https://dask-gateway-k8s-slurm.geddes.rcac.purdue.edu",
            conda_env: kernel.python_exec_path.split("/bin/")[0],
            worker_cores: worker_cores,
            worker_memory: worker_memory
          }
        }
      }
    } else if (cluster_type=="dask-gateway-k8s") {
      new_config = {
        default: {
          adapt: {
              minimum: min_workers,
              maximum: max_workers
            }
        },
        factory: {
          class: "GatewayCluster",
          module: "dask_gateway",
          args: [],
          kwargs: {
            address: "http://dask-gateway-k8s.geddes.rcac.purdue.edu/",
            proxy_address: "traefik-dask-gateway-k8s.cms.geddes.rcac.purdue.edu:8786",
            public_address: "https://dask-gateway-k8s.geddes.rcac.purdue.edu",
            conda_env: kernel.python_exec_path.split("/bin/")[0],
            worker_cores: worker_cores,
            worker_memory: worker_memory
          }
        }
      }
    // } else if (cluster_type=="dask-gateway-hats") {
    //   new_config = {
    //     default: {
    //       adapt: {
    //           minimum: min_workers,
    //           maximum: max_workers
    //         }
    //     },
    //     factory: {
    //       class: "GatewayCluster",
    //       module: "dask_gateway",
    //       args: [],
    //       kwargs: {
    //         address: "http://dask-gateway-hats.geddes.rcac.purdue.edu/",
    //         proxy_address: "traefik-dask-gateway-hats.cms.geddes.rcac.purdue.edu:8786",
    //         public_address: "https://dask-gateway-hats.geddes.rcac.purdue.edu",
    //         conda_env: kernel.python_exec_path.split("/bin/")[0],
    //         worker_cores: worker_cores,
    //         worker_memory: worker_memory
    //       }
    //     }
    //   }
    } else {
      new_config = {}
    }
  };
  return showDialog({
    title: `Configure Dask cluster`,
    body: (
      <ClusterConfig
        cluster_type={cluster_type}
        kernel={{
          name: kernelspecs.default,
          display_name: kernelspecs.kernelspecs[kernelspecs.default].spec.display_name,
          python_exec_path: kernelspecs.kernelspecs[kernelspecs.default].spec.argv[0]
        }}
        user_info={user_info}
        min_workers={DEFAULT_MIN_WORKERS}
        max_workers={DEFAULT_MAX_WORKERS}
        worker_cores={DEFAULT_WORKER_CORES}
        worker_memory={DEFAULT_WORKER_MEMORY}
        kernelspecs={kernelspecs}
        stateEscapeHatch={escapeHatch}
      />
    ),
    buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Apply' })]
  }).then(result => {
    if (result.button.accept) {
      return new_config;
    } else {
      return null;
    }
  });
}
