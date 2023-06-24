import { Dialog, showDialog } from '@jupyterlab/apputils';

import * as React from 'react';

const DEFAULT_PYTHON: string = "/depot/cms/kernels/python3";

namespace ClusterConfig {
  export interface IState {
    is_slurm: boolean;
    python: string;
  }
  export interface IProps {
    is_slurm: boolean;
    python: string;
    stateEscapeHatch: (is_slurm: boolean, python: string) => void;
  }
}


export class ClusterConfig extends React.Component<ClusterConfig.IProps, ClusterConfig.IState> {
  
  constructor(props: ClusterConfig.IProps) {
    super(props);
    const is_slurm = props.is_slurm;
    const python = props.python;
    this.state = { is_slurm, python };
  }

  componentDidMount() {
    this.resetValues();
  }

  onClusterTypeChanged(event: React.ChangeEvent<{ value: unknown }>): void {
    const value = event.target.value === "true";
    let python = "";
    if (value) { python = DEFAULT_PYTHON }
    this.setState({
      is_slurm: value,
      python: python
    });
    this.props.stateEscapeHatch(value, python);
  }

  onPythonExecChanged(event: React.ChangeEvent<{ value: unknown }>): void {
    const python = event.target.value as string
    if (!this.state.is_slurm) { return }
    this.setState({
      is_slurm: true,
      python: python
    });
    this.props.stateEscapeHatch(true, python);
  }

  resetValues(): void {
    const is_slurm = false;
    const python = "";
    this.setState({ is_slurm, python });
    this.props.stateEscapeHatch(is_slurm, python);
  }

  /**
   * Render the component..
   */
  render() {
    const is_slurm = this.state.is_slurm;
    const disabledClass = 'dask-mod-disabled';
    return (
    <div>
      <div>
        <span className="dask-ClusterConfigHeader"></span>
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

export function showClusterConfigDialog(config: {}): Promise<{}> {
  let new_config = { ...config };
  const escapeHatch = (is_slurm: boolean, python: string) => {
    if (is_slurm) {
      new_config = {
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
      <ClusterConfig is_slurm={false} python={""} stateEscapeHatch={escapeHatch}/>
    ),
    buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Apply' })]
  }).then(result => {
    if (result.button.accept) {
      console.log(result);
      return new_config;
    } else {
      return config;
    }
  });
}
