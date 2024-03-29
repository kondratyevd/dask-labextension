import { Dialog, showDialog } from '@jupyterlab/apputils';

import * as React from 'react';

const DEFAULT_CLUSTER_TYPE = "dask-gateway-k8s-slurm";
const DEFAULT_MIN_WORKERS = 1;
const DEFAULT_MAX_WORKERS = 2;

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


namespace ClusterConfig {
  export interface IState {
    cluster_type: string;
    kernel: Kernel;
    min_workers: number;
    max_workers: number;
  }
  export interface IProps {
    cluster_type: string;
    kernelspecs: KernelSpecs;
    kernel: Kernel;
    min_workers: number;
    max_workers: number;
    stateEscapeHatch: (cluster_type: string, kernel: Kernel, min_workers: number, max_workers: number) => void;
  }
}

export class ClusterConfig extends React.Component<ClusterConfig.IProps, ClusterConfig.IState> {
  
  constructor(props: ClusterConfig.IProps) {
    super(props);
    const cluster_type = props.cluster_type;
    const kernel = props.kernel;
    const min_workers = props.min_workers;
    const max_workers = props.max_workers;
    this.state = { cluster_type, kernel, min_workers, max_workers};
  }

  componentDidMount() {
    this.resetValues();
  }

  componentDidUpdate(): void {
    this.props.stateEscapeHatch(this.state.cluster_type, this.state.kernel, this.state.min_workers, this.state.max_workers);
  }

  resetValues(): void {
    const cluster_type = DEFAULT_CLUSTER_TYPE;
    const ks = this.props.kernelspecs;
    const kernel = {
      name: ks.default,
      display_name: ks.kernelspecs[ks.default].spec.display_name,
      python_exec_path: ks.kernelspecs[ks.default].spec.argv[0]
    };
    const min_workers = DEFAULT_MIN_WORKERS;
    const max_workers = DEFAULT_MAX_WORKERS;
    this.setState({ cluster_type, kernel, min_workers, max_workers });
    this.props.stateEscapeHatch(cluster_type, kernel, min_workers, max_workers);
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
      python_exec_path: ks.kernelspecs[ks.default].spec.argv[0]
    };
    this.setState({
      kernel: kernel
    });
  }

  onMinimumChanged(event: React.ChangeEvent): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    const minimum = Math.max(0, value);
    const maximum = Math.max(this.state.max_workers, minimum);
    this.setState({
      min_workers: minimum,
      max_workers: maximum
    });
  }

  onMaximumChanged(event: React.ChangeEvent): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    const maximum = Math.max(0, value);
    const minimum = Math.min(this.state.min_workers, maximum);
    this.setState({
      min_workers: minimum,
      max_workers: maximum
    });
  }

  /**
   * Render the component..
   */
  render() {
    const cluster_type = this.state.cluster_type;
    const min_workers = this.state.min_workers;
    const max_workers = this.state.max_workers;
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
                (Hammer cluster: Purdue users only)
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
                (Geddes cluster: All users)
              </div>
            </label>
          </div>
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
                  onChange={evt => {
                    this.onKernelChanged(evt);
                  }}
                >
                  {Object.values(ks.kernelspecs).map(kernel => {
                    if (kernel.spec.language === "python") { 
                      return (<option value={kernel.name} selected={kernel.name === ks.default}> {kernel.spec.display_name} </option>)
                    }
                  })}
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
              step="1"
              onChange={evt => {
                this.onMaximumChanged(evt);
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

export function showClusterConfigDialog(kernelspecs: KernelSpecs): Promise<{}|null> {
  let new_config = {}

  const escapeHatch = (cluster_type: string, kernel: Kernel, min_workers: number, max_workers: number) => {
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
            worker_cores: 1,
            worker_memory: 4,
            env: {"X509_USER_PROXY": "", "WORKDIR": ""}
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
            address: "http://dask-gateway-k8s.geddes.rcac.purdue.edu",
            proxy_address: "api-dask-gateway-k8s.cms.geddes.rcac.purdue.edu:8000",
            public_address: "https://dask-gateway-k8s.geddes.rcac.purdue.edu",
            conda_env: kernel.python_exec_path.split("/bin/")[0],
            worker_cores: 1,
            worker_memory: 4,
            env: {"X509_USER_PROXY": "", "WORKDIR": ""}
          }
        }
      }
    } else {
      new_config = {}
    }
  };
  return showDialog({
    title: `Configure Dask cluster`,
    body: (
      <ClusterConfig
        cluster_type={DEFAULT_CLUSTER_TYPE}
        kernel={{
          name: kernelspecs.default,
          display_name: kernelspecs.kernelspecs[kernelspecs.default].spec.display_name,
          python_exec_path: kernelspecs.kernelspecs[kernelspecs.default].spec.argv[0]
        }}
        min_workers={DEFAULT_MIN_WORKERS}
        max_workers={DEFAULT_MAX_WORKERS}
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
