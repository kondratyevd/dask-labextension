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
  onClusterTypeChanged(event: React.ChangeEvent): void {
    console.log("Test opt 2")
    const value = (event.target as HTMLInputElement).checked;
    this.setState({
    //   model: this.state.model,
      is_slurm: value
    });
  }

  // FIXME - this should overwrite dask config
  onPythonExecChanged(event: React.ChangeEvent): void {
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
        <span className="dask-ScalingHeader">Use LocalCluster</span>
        <div className="dask-ScalingSection">
          <div className="dask-ScalingSection-item">
            <span
              className={`dask-ScalingSection-label ${
                is_slurm ? disabledClass : ''
              }`}
            >
              Use local cluster
            </span>
          </div>
        </div>
        <div className="dask-ScalingHeader">
          Use SLURM cluster
          <input
            className="dask-ScalingCheckbox"
            type="checkbox"
            checked={is_slurm}
            onChange={evt => {
              this.onClusterTypeChanged(evt);
            }}
          />
        </div>
        <div className="dask-ScalingSection">
          <div className="dask-ScalingSection-item">
            <span
              className={`dask-ScalingSection-label ${
                !is_slurm ? disabledClass : ''
              }`}
            >
              Select python executable
            </span>
            <select
              className="dask-ScalingInput"
              disabled={!is_slurm}
              value="Test"
              onChange={evt => {
                this.onPythonExecChanged(evt);
              }}>
                <option value="">Select kernel</option>
                <option value="/depot/cms/kernels/python3/bin/python3">Python3 kernel</option>
                <option value="/depot/cms/kernels/python3-ml/bin/python3">Python3 [ML] kernel</option>
            </select>
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
    buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'CONFIG' })]
  }).then(result => {
    return;
  });
}
