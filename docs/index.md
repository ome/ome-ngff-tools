
<h1>OME-NGFF tools</h1>

The following versions of each viewer were used in testing:

- <a href="https://napari.org">napari</a> 0.4.16 with plugin <a href="https://github.com/ome/napari-ome-zarr/">napari-ome-zarr</a> 0.5.2 and <a href="https://github.com/ome/ome-zarr-py/">ome-zarr</a> 0.6.0.
  - Open via command line: `napari https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0062A/6001240.zarr`
  - Use napari console to open additional image: `viewer.open("https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0101A/13457537.zarr", plugin="napari-ome-zarr")`
- <a href="https://github.com/hms-dbmi/vizarr/">vizarr</a> using <a href="https://hms-dbmi.github.io/vizarr">current viewer</a> October 2022. Open via URL - see <a href="https://hms-dbmi.github.io/vizarr/?source=https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.3/idr0079A/9836998.zarr">example</a>.
- <a href="https://github.com/mobie/mobie-viewer-fiji/">MoBIE</a> plugin for ImageJ/Fiji. Open with `Plugins > BigDataViewer > OME-Zarr > Open OME-Zarr From...`. See also <a href="https://omero-guides.readthedocs.io/en/latest/fiji/docs/view_mobie_zarr.html">MoBIE installation guide</a>
- <a href="https://itkwidgets.readthedocs.io/en/latest">itkwidgets</a>. Use in a python notebook, or open via URL: See <a href="https://kitware.github.io/itk-vtk-viewer/app/?rotate=false&fileToLoad=https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0062A/6001240.zarr">example</a>.
- <a href="https://webknossos.org">webKnossos</a> version 19988.
- <a href="https://www.openmicroscopy.org/omero/">OMERO</a> with BioFormats <a href="https://github.com/ome/ZarrReader">ZarrReader</a> 0.2.0.


<style>
  .supported {
    background: green;
  }
  .fails {
    background: red;
  }
  .ignored {
    background: yellow;
  }
  .missing {
    background: grey;
  }

</style>

<h3>Key</h3>

<table>
  <tbody>
  <tr>
    <td>Feature supported</td>
    <td class="supported"> </td>
  </tr>
  <tr>
    <td>Not supported (no effect)</td>
    <td class="ignored"> </td>
  </tr>
  <tr>
    <td>Image doesn't open correctly</td>
    <td class="fails"> </td>
  </tr>
  <tr>
    <td>Not tested / not confirmed</td>
    <td class="missing"> </td>
  </tr>
  </tbody>
</table>

  

<table>
  <thead>
    <tr>
      <th>feature</th>
      <td>sample data</td>
      {% for viewer in site.data.viewers %}
        <th>{{ viewer.id }}</th>
      {% endfor %}
    </tr>
  </thead>
  <tbody>
    {% for feature in site.data.features %}
      <tr>
        <td>{{ feature.name }}</td>
        <td>
          {% if feature.sample_url and feature.sample_name %}
            <a href="{{ feature.sample_url }}" >{{ feature.sample_name }}</a>
          {% endif %}
          {% if feature.sample_html %}
            {{ feature.sample_html }}
          {% endif %}
        </td>

        {% for viewer_data in site.data.viewers %}
        {% assign viewer = viewer_data.id %}
        <td class="{% if feature[viewer].supported %}supported{% elsif feature[viewer].opens == false %}fails{% elsif feature[viewer].opens %}ignored{% else %}missing{% endif %}">

          {% if feature[viewer].viewer_url %}
            <!-- e.g. webknosses or OMERO might have URLs for imported images -->
            <a href="{{ feature[viewer].viewer_url }}" target="_blank" title="View the sample file in this viewer in a new tab">
              <img src="assets/img/icon_eye.svg" />
            </a>
          {% elsif viewer_data.viewer_url and feature.sample_url%}
          <!-- e.g. vizarr, vtk and neuroglancer allow direct opening image URL in viewer -->
            <a href='{{ viewer_data.viewer_url }}{{ feature.sample_url }}{% if viewer_data.viewer_url_postfix %}{{ viewer_data.viewer_url_postfix }}{% endif %}'
               target="_blank" title="View the sample file in this viewer in a new tab">
              <img src="assets/img/icon_eye.svg" />
            </a>
          {% endif %}

          {% if feature[viewer].issue_url %}
            <a href="{{ feature[viewer].issue_url }}" target="_blank">
              <img src="https://github.githubassets.com/favicons/favicon.svg" width="20px" height="20px" />
            </a>
          {% endif %}

          {% if feature[viewer].notes %}
            <img src="assets/img/icon_info.svg" width="20px" height="20px" title="{{ feature[viewer].notes }}" />
          {% endif %}
        </td>
        {% endfor %}
      </tr>
    {% endfor %}
  </tbody>
</table>
