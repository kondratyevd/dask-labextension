import { Dialog, showDialog } from '@jupyterlab/apputils';

import * as React from 'react';

/**
 * A namespace for ClusterConfig statics.
 */
namespace ClusterConfig {
  export interface IState {
    is_slurm: boolean;
  }
}

/**
 * A component for an HTML form that allows the user
 * to select cluster parameters.
 */
export class ClusterConfig extends React.Component<{}, ClusterConfig.IState> {
  
  constructor(props: {}) {
    super(props);
    const is_slurm = false; // FIXME - load this from dask config
    this.state = { is_slurm };
  }

  // FIXME - this should overwrite dask config
  onClusterTypeChanged(event: React.ChangeEvent<{ value: unknown }>): void {
    const value = event.target.value === "true";
    this.setState({
      is_slurm: value
    });
  }

  // FIXME - this should overwrite dask config
  onPythonExecChanged(event: React.ChangeEvent<{ value: unknown }>): void {
    const python = event.target.value as string
    console.log(`${python}`)
    // this.setState({
    //   model: {
    //     ...this.state.model,
    //     workers: parseInt((event.target as HTMLInputElement).value, 10)
    //   }
    // });
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
        <span className="dask-ClusterConfigHeader">Cluster Type</span>
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
              Use Local Cluster
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
              Use SLURM Cluster
            </label>
            {is_slurm && (
              <div className="dask-ClusterConfigSection-item">
                <span
                  className={`dask-ClusterConfigSection-label ${
                    !is_slurm ? disabledClass : ''
                  }`}
                >
                  Select Python Executable
                </span>
                <select
                  className="dask-ClusterConfigInput"
                  disabled={!is_slurm}
                  onChange={evt => {
                    this.onPythonExecChanged(evt);
                  }}
                >
                  <option value="">Select kernel</option>
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
export function showClusterConfigDialog(): Promise<void> {
  return showDialog({
    title: `Configure cluster`,
    body: (
      <ClusterConfig/>
    ),
    buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Apply' })]
  }).then(result => {
    return;
  });
}
