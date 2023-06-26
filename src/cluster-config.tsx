import { Dialog, showDialog } from '@jupyterlab/apputils';

import * as React from 'react';

// const DEFAULT_PYTHON: string = "/depot/cms/kernels/python3";

namespace ClusterConfig {
  export interface IState {
    is_slurm: boolean;
    python: string;
    min_workers: number;
    max_workers: number;
  }
  export interface IProps {
    is_slurm: boolean;
    python: string;
    min_workers: number;
    max_workers: number;
    stateEscapeHatch: (is_slurm: boolean, python: string, min_workers: number, max_workers: number) => void;
  }
}


export class ClusterConfig extends React.Component<ClusterConfig.IProps, ClusterConfig.IState> {
  
  constructor(props: ClusterConfig.IProps) {
    super(props);
    const is_slurm = props.is_slurm;
    const python = props.python;
    const min_workers = props.min_workers;
    const max_workers = props.max_workers;
    this.state = { is_slurm, python, min_workers, max_workers};
  }

  componentDidMount() {
    this.resetValues();
  }

  componentDidUpdate(): void {
    this.props.stateEscapeHatch(this.state.is_slurm, this.state.python, this.state.min_workers, this.state.max_workers);
  }

  resetValues(): void {
    const is_slurm = false;
    const python = "";
    const min_workers = 1;
    const max_workers = 2;
    this.setState({ is_slurm, python, min_workers, max_workers });
    this.props.stateEscapeHatch(is_slurm, python, min_workers, max_workers);
  }

  onClusterTypeChanged(event: React.ChangeEvent<{ value: unknown }>): void {
    const value = event.target.value === "true";
    this.setState({
      is_slurm: value,
    });
  }

  onPythonExecChanged(event: React.ChangeEvent<{ value: unknown }>): void {
    const python = event.target.value as string
    if (!this.state.is_slurm) { return }
    this.setState({
      python: python
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
    const is_slurm = this.state.is_slurm;
    const min_workers = this.state.min_workers;
    const max_workers = this.state.max_workers;
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
                value="false"
                checked={!is_slurm}
                onChange={evt => {
                  this.onClusterTypeChanged(evt);
                }}
              />
              Use local cluster
            </label>
          </div>
          <div className="dask-ClusterConfigSection-item">
            <label>
              <input
                type="radio"
                name="clusterType"
                value="true"
                checked={is_slurm}
                onChange={evt => {
                  this.onClusterTypeChanged(evt);
                }}
              />
              Use SLURM cluster
            </label>
            {is_slurm && (
              <div className="dask-ClusterConfigSection-item">
                <span
                  className={`dask-ClusterConfigSection-label ${
                    !is_slurm ? disabledClass : ''
                  }`}
                >
                </span>
                <select
                  className={`dask-ClusterConfigSelect ${
                    !is_slurm ? disabledClass : ''
                  }`}
                  disabled={!is_slurm}
                  onChange={evt => {
                    this.onPythonExecChanged(evt);
                  }}
                >
                  <option value="/depot/cms/kernels/python3/bin/python3">Python3 kernel</option>
                  <option value="/depot/cms/kernels/python3-ml/bin/python3">Python3 [ML] kernel</option>
                </select>
              </div>
            )}
          </div>
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

export function showClusterConfigDialog(config: {}): Promise<{}|null> {
  let new_config = { ...config };
  const escapeHatch = (is_slurm: boolean, python: string, min_workers: number, max_workers: number) => {
    if (is_slurm) {
      new_config = {
        default: {
          adapt: {
              minimum: min_workers,
              maximum: max_workers
            }
        },
        factory: {
          class: "PurdueSLURMCluster",
          module: "purdue_slurm",
          args: [],
          kwargs: {
            account: "cms",
            cores: 1,
            memory: "2G",
            job_extra_directives: [
              "--qos=normal",
              "--reservation=DASKTEST",
              "-o /tmp/dask_job.%j.%N.out",
              "-e /tmp/dask_job.%j.%N.error"
            ],
            python: python
          }
        }
      };
    } else {
      new_config = {
        default: {
          adapt: {
            minimum: min_workers,
            maximum: max_workers
        }
        },
        factory: {
          class: "LocalCluster",
          module: "dask.distributed",
          args: [],
          kwargs: {}
        }
      };
    }
  };
  return showDialog({
    title: `Configure Dask cluster`,
    body: (
      <ClusterConfig
        is_slurm={false}
        python={""}
        min_workers={1}
        max_workers={2}
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
