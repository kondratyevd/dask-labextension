import { Dialog, showDialog } from '@jupyterlab/apputils';

import * as React from 'react';


namespace ClusterConfig {
  export interface IState {
    is_slurm: boolean;
  }

  export interface IProps {
    is_slurm: boolean;
  }
}


export class ClusterConfig extends React.Component<ClusterConfig.IProps, ClusterConfig.IState> {
  
  constructor(props: ClusterConfig.IProps) {
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
// export function showClusterConfigDialog(): Promise<void> {
//   return showDialog({
//     title: `Configure Dask cluster`,
//     body: (
//       <ClusterConfig/>
//     ),
//     buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Apply' })]
//   }).then(result => {
//     return;
//   });
// }

export function showClusterConfigDialog(): Promise<object | null> {
  return showDialog({
    title: `Configure Dask cluster`,
    body: (
      <ClusterConfig is_slurm={is_slurm}/>
    ),
    buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Apply' })]
  }).then(result => {
    if (result.button.accept) {
      const is_slurm = result.value.is_slurm;

      if (is_slurm) {
        return {
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
              ]
            }
          }
        };
      } else {
        return {
          factory: {
            class: "LocalCluster",
            module: "dask.distributed",
            args: [],
            kwargs: {}
          }
        };
      }
    } else {
      return null;
    }
  });
}
